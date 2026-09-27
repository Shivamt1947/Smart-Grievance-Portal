import { Grievance } from '../models/Grievance.js';
import { User } from '../models/User.js';
import { ApprovedStudent } from '../models/ApprovedStudent.js';
import { ApprovedTeacher } from '../models/ApprovedTeacher.js';
import { CommonIssue } from '../models/CommonIssue.js';
import { Feedback } from '../models/Feedback.js';
import { AuditLog } from '../models/AuditLog.js';
import { generateAdminInsights } from '../services/ai/aiService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getSystemAnalytics = asyncHandler(async (req, res) => {
  // Aggregate real grievance metrics directly from MongoDB
  const [
    totalGrievances,
    statusCounts,
    priorityCounts,
    categoryCounts,
    totalStudents,
    totalTeachers,
    commonIssuesCount,
    feedbackStats,
  ] = await Promise.all([
    Grievance.countDocuments(),
    Grievance.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Grievance.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Grievance.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    CommonIssue.countDocuments({ status: { $ne: 'RESOLVED' } }),
    Feedback.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalFeedback: { $sum: 1 },
          ratingsBreakdown: { $push: '$rating' },
        },
      },
    ]),
  ]);

  // Map counts to convenient object keys
  const statusMap = {
    PENDING: 0,
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    CLOSED: 0,
    ESCALATED: 0,
    REOPENED: 0,
  };
  statusCounts.forEach((s) => {
    if (statusMap[s._id] !== undefined) {
      statusMap[s._id] = s.count;
    }
  });

  const priorityMap = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    URGENT: 0,
  };
  priorityCounts.forEach((p) => {
    if (priorityMap[p._id] !== undefined) {
      priorityMap[p._id] = p.count;
    }
  });

  // Average resolution time in hours for resolved grievances
  const resolvedWithTimestamps = await Grievance.find({
    resolvedAt: { $ne: null },
  }).select('createdAt resolvedAt');

  let avgResolutionHours = 0;
  if (resolvedWithTimestamps.length > 0) {
    const totalDurationMs = resolvedWithTimestamps.reduce((acc, g) => {
      const diff = new Date(g.resolvedAt).getTime() - new Date(g.createdAt).getTime();
      return acc + (diff > 0 ? diff : 0);
    }, 0);
    avgResolutionHours = Math.round((totalDurationMs / (resolvedWithTimestamps.length * 3600000)) * 10) / 10;
  }

  // Teacher workload analysis
  const teachers = await User.find({ role: 'teacher', isActive: true }).select('name department designation');
  const teacherWorkloads = await Promise.all(
    teachers.map(async (teacher) => {
      const [assigned, resolved, escalated] = await Promise.all([
        Grievance.countDocuments({ assignedTeacher: teacher._id, status: { $in: ['ASSIGNED', 'IN_PROGRESS'] } }),
        Grievance.countDocuments({ assignedTeacher: teacher._id, status: { $in: ['RESOLVED', 'CLOSED'] } }),
        Grievance.countDocuments({ assignedTeacher: teacher._id, status: 'ESCALATED' }),
      ]);
      return {
        id: teacher._id,
        name: teacher.name,
        department: teacher.department,
        activeCount: assigned,
        resolvedCount: resolved,
        escalatedCount: escalated,
      };
    })
  );

  // Grievance trend over the last 7 days
  const now = new Date();
  const past7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const count = await Grievance.countDocuments({
      createdAt: { $gte: d, $lt: nextD },
    });

    past7Days.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      submissions: count,
    });
  }

  const avgRating = feedbackStats[0]?.avgRating ? Math.round(feedbackStats[0].avgRating * 10) / 10 : 0;
  const escalationRate = totalGrievances > 0 ? Math.round((statusMap.ESCALATED / totalGrievances) * 100) : 0;

  return res.status(200).json({
    success: true,
    metrics: {
      totalGrievances,
      pendingCount: statusMap.PENDING,
      assignedCount: statusMap.ASSIGNED,
      inProgressCount: statusMap.IN_PROGRESS,
      resolvedCount: statusMap.RESOLVED,
      closedCount: statusMap.CLOSED,
      escalatedCount: statusMap.ESCALATED,
      reopenedCount: statusMap.REOPENED,
      totalStudents,
      totalTeachers,
      commonIssuesCount,
      avgResolutionHours,
      escalationRate,
      averageRating: avgRating,
      totalFeedback: feedbackStats[0]?.totalFeedback || 0,
      priorityBreakdown: priorityMap,
      categoryBreakdown: categoryCounts,
      teacherWorkloads,
      trendLast7Days: past7Days,
    },
  });
});

export const getAIInsights = asyncHandler(async (req, res) => {
  const [
    totalGrievances,
    statusCounts,
    categoryCounts,
    commonIssuesCount,
    feedbackStats,
  ] = await Promise.all([
    Grievance.countDocuments(),
    Grievance.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Grievance.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    CommonIssue.countDocuments({ status: { $ne: 'RESOLVED' } }),
    Feedback.aggregate([{ $group: { _id: null, avgRating: { $avg: '$rating' } } }]),
  ]);

  const statusMap = {};
  statusCounts.forEach((s) => {
    statusMap[s._id] = s.count;
  });

  const analyticsData = {
    totalGrievances,
    pendingCount: statusMap.PENDING || 0,
    inProgressCount: (statusMap.ASSIGNED || 0) + (statusMap.IN_PROGRESS || 0),
    escalatedCount: statusMap.ESCALATED || 0,
    resolvedCount: statusMap.RESOLVED || 0,
    closedCount: statusMap.CLOSED || 0,
    categoryBreakdown: categoryCounts,
    commonIssuesCount,
    averageRating: feedbackStats[0]?.avgRating || null,
  };

  const insights = await generateAdminInsights(analyticsData);

  return res.status(200).json({
    success: true,
    insights,
  });
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const skip = (page - 1) * limit;

  const { action, role, search } = req.query;
  const query = {};

  if (action && action !== 'ALL') query.action = action;
  if (role && role !== 'ALL') query.role = role;
  if (search && search.trim()) {
    query.details = new RegExp(search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
  }

  const [total, logs] = await Promise.all([
    AuditLog.countDocuments(query),
    AuditLog.find(query)
      .populate('user', 'name email role institutionalId')
      .populate('grievance', 'trackingId title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return res.status(200).json({
    success: true,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
    logs,
  });
});

export const getApprovedRecords = asyncHandler(async (req, res) => {
  const { type = 'students', search } = req.query;

  if (type === 'students') {
    const query = {};
    if (search && search.trim()) {
      const reg = new RegExp(search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      query.$or = [{ institutionalId: reg }, { name: reg }, { email: reg }];
    }
    const records = await ApprovedStudent.find(query).sort({ institutionalId: 1 }).limit(100);
    return res.status(200).json({ success: true, records, type: 'students' });
  } else {
    const query = {};
    if (search && search.trim()) {
      const reg = new RegExp(search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      query.$or = [{ institutionalId: reg }, { name: reg }, { email: reg }];
    }
    const records = await ApprovedTeacher.find(query).sort({ institutionalId: 1 }).limit(100);
    return res.status(200).json({ success: true, records, type: 'teachers' });
  }
});

export const addApprovedRecord = asyncHandler(async (req, res) => {
  const { type = 'student', institutionalId, name, email, department, year, division, designation } = req.body;

  if (!institutionalId || !name || !email || !department) {
    return res.status(400).json({
      success: false,
      message: 'Institutional ID, Name, Email, and Department are required.',
    });
  }

  const normalizedId = institutionalId.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  if (type === 'student') {
    const existing = await ApprovedStudent.findOne({
      $or: [{ institutionalId: normalizedId }, { email: normalizedEmail }],
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Student ID or email already registered in roster.' });
    }

    const record = await ApprovedStudent.create({
      institutionalId: normalizedId,
      name: name.trim(),
      email: normalizedEmail,
      department: department.trim(),
      year: parseInt(year || '1', 10),
      division: division ? division.trim() : 'A',
    });

    return res.status(201).json({ success: true, message: 'Approved student record added.', record });
  } else {
    const existing = await ApprovedTeacher.findOne({
      $or: [{ institutionalId: normalizedId }, { email: normalizedEmail }],
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Teacher ID or email already in database.' });
    }

    const record = await ApprovedTeacher.create({
      institutionalId: normalizedId,
      name: name.trim(),
      email: normalizedEmail,
      department: department.trim(),
      designation: designation || 'Assistant Professor',
    });

    return res.status(201).json({ success: true, message: 'Approved faculty record added.', record });
  }
});

export const getUsers = asyncHandler(async (req, res) => {
  const { role, department, search } = req.query;
  const query = {};

  if (role && role !== 'ALL') query.role = role;
  if (department && department !== 'ALL') query.department = department;
  if (search && search.trim()) {
    const reg = new RegExp(search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    query.$or = [{ name: reg }, { email: reg }, { institutionalId: reg }];
  }

  const users = await User.find(query)
    .select('-salt -hash')
    .sort({ createdAt: -1 })
    .limit(100);

  return res.status(200).json({ success: true, users });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (user.role === 'admin' && user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account.' });
  }

  user.isActive = !user.isActive;
  await user.save();

  return res.status(200).json({
    success: true,
    message: `User ${user.name} is now ${user.isActive ? 'Active' : 'Deactivated'}.`,
    user,
  });
});
