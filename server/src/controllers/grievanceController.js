import { z } from 'zod';
import { Grievance } from '../models/Grievance.js';
import { User } from '../models/User.js';
import { Worker } from '../models/Worker.js';
import { CommonIssue } from '../models/CommonIssue.js';
import { checkDuplicatesAndCommonIssues } from '../services/duplicateService.js';
import { analyzeGrievanceDraft } from '../services/ai/aiService.js';
import { logAudit } from '../services/auditService.js';
import { createNotification, notifyAdmins } from '../services/notificationService.js';
import { processUploadedFile } from '../utils/fileUpload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const grievanceCreateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  description: z.string().min(15, 'Description must be at least 15 characters').max(3000),
  category: z.string().min(2),
  location: z.string().min(2).max(100),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  forceSubmit: z.string().optional(),
});

// Helper to generate unique sequential tracking ID
const generateTrackingId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `GRV-${currentYear}-`;

  // Find the latest grievance for this year sorted descending by trackingId
  const latestGrievance = await Grievance.findOne({
    trackingId: { $regex: `^GRV-${currentYear}-\\d+$` },
  })
    .sort({ trackingId: -1 })
    .select('trackingId')
    .lean();

  let nextSequence = 1;
  if (latestGrievance && latestGrievance.trackingId) {
    const parts = latestGrievance.trackingId.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSequence = lastNum + 1;
    }
  }

  // Ensure candidate ID does not collide with any existing record
  let candidateId = `${prefix}${nextSequence.toString().padStart(4, '0')}`;
  while (await Grievance.exists({ trackingId: candidateId })) {
    nextSequence += 1;
    candidateId = `${prefix}${nextSequence.toString().padStart(4, '0')}`;
  }

  return candidateId;
};

export const checkDuplicates = asyncHandler(async (req, res) => {
  const { title, description, category, location } = req.body;
  if (!title || !description || !category) {
    return res.status(400).json({
      success: false,
      message: 'Title, description, and category are required for duplicate checking.',
    });
  }

  const results = await checkDuplicatesAndCommonIssues({
    studentId: req.user._id,
    title,
    description,
    category,
    location: location || '',
  });

  return res.status(200).json({
    success: true,
    ...results,
  });
});

export const createGrievance = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Only registered students can submit grievances.',
    });
  }

  const validated = grievanceCreateSchema.parse(req.body);
  const isForceSubmit = req.body.forceSubmit === 'true' || req.body.forceSubmit === true;

  // Duplicate Check: Same student active complaint prevention
  const dupCheck = await checkDuplicatesAndCommonIssues({
    studentId: req.user._id,
    title: validated.title,
    description: validated.description,
    category: validated.category,
    location: validated.location,
  });

  if (dupCheck.hasSameStudentDuplicate && !isForceSubmit) {
    return res.status(409).json({
      success: false,
      isDuplicateWarning: true,
      message: 'Possible duplicate grievance found in your active submissions.',
      duplicateGrievance: dupCheck.sameStudentDuplicate,
    });
  }

  // Handle file uploads
  const attachments = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const processed = await processUploadedFile(file);
      attachments.push(processed);
    }
  }

  // Generate tracking ID
  const trackingId = await generateTrackingId();

  // 24-Hour SLA Calculation (authoritative backend)
  const slaHours = parseInt(process.env.SLA_HOURS || '24', 10);
  const dueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000);

  // AI draft enrichment
  const aiDraft = await analyzeGrievanceDraft({
    title: validated.title,
    description: validated.description,
    location: validated.location,
  });

  // Check if this links to an active common campus issue
  let commonIssueId = null;
  if (dupCheck.matchingCommonIssue) {
    commonIssueId = dupCheck.matchingCommonIssue.id;
  }

  const grievance = await Grievance.create({
    trackingId,
    title: validated.title,
    description: validated.description,
    category: validated.category,
    location: validated.location,
    priority: validated.priority,
    status: 'PENDING',
    student: req.user._id,
    attachments,
    commonIssue: commonIssueId,
    dueAt,
    aiAnalysis: {
      suggestedCategory: aiDraft.suggestedCategory,
      suggestedPriority: aiDraft.suggestedPriority,
      summary: aiDraft.summary,
      confidence: aiDraft.confidence,
      missingInfo: aiDraft.missingInfo,
    },
    isDuplicateConfirmed: isForceSubmit,
  });

  // Update common issue count if linked
  if (commonIssueId) {
    await CommonIssue.findByIdAndUpdate(commonIssueId, {
      $addToSet: { grievances: grievance._id },
      $inc: { affectedStudentCount: 1 },
    });
  }

  // Audit Log
  await logAudit({
    grievanceId: grievance._id,
    userId: req.user._id,
    role: 'student',
    action: 'GRIEVANCE_SUBMITTED',
    details: `Student submitted grievance ${trackingId} in ${validated.category} at ${validated.location}. SLA Due: ${dueAt.toISOString()}`,
    ipAddress: req.ip,
  });

  // Student Notification
  await createNotification({
    recipientId: req.user._id,
    title: 'Grievance Submitted Successfully',
    message: `Your grievance "${grievance.title}" (${trackingId}) has been registered with a 24-hour resolution SLA.`,
    type: 'SUBMISSION',
    link: `/student/grievances/${grievance._id}`,
    grievanceId: grievance._id,
  });

  // Admin Notification
  await notifyAdmins({
    title: `New Grievance Submitted: ${trackingId}`,
    message: `New ${validated.priority} priority grievance submitted by ${req.user.name} in ${validated.category}.`,
    type: 'SUBMISSION',
    link: `/admin/grievances/${grievance._id}`,
    grievanceId: grievance._id,
  });

  return res.status(201).json({
    success: true,
    message: 'Grievance submitted successfully.',
    grievance,
  });
});

export const getGrievances = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
  const skip = (page - 1) * limit;

  const {
    status,
    category,
    priority,
    department,
    search,
    isOverdue,
    teacherId,
  } = req.query;

  const query = {};

  // Role-based scoping
  if (req.user.role === 'student') {
    query.student = req.user._id;
  } else if (req.user.role === 'teacher') {
    query.assignedTeacher = req.user._id;
  } else if (req.user.role === 'worker') {
    const workerRecord = await Worker.findOne({ user: req.user._id, isActive: true });
    if (workerRecord) {
      query.assignedWorker = workerRecord._id;
    } else {
      query._id = null; // returns empty
    }
  } else if (req.user.role === 'admin') {
    if (teacherId) {
      query.assignedTeacher = teacherId;
    }
  }

  // Filters
  if (status && status !== 'ALL') {
    query.status = status;
  }

  if (category && category !== 'ALL') {
    query.category = category;
  }

  if (priority && priority !== 'ALL') {
    query.priority = priority;
  }

  if (isOverdue === 'true') {
    query.dueAt = { $lt: new Date() };
    query.status = { $in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'] };
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    query.$or = [
      { trackingId: searchRegex },
      { title: searchRegex },
      { location: searchRegex },
      { category: searchRegex },
    ];
  }

  const total = await Grievance.countDocuments(query);
  const grievances = await Grievance.find(query)
    .populate('student', 'name institutionalId department year division')
    .populate('assignedTeacher', 'name institutionalId department designation')
    .populate('commonIssue', 'title status affectedStudentCount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.status(200).json({
    success: true,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
    grievances,
  });
});

export const getGrievanceById = asyncHandler(async (req, res) => {
  const grievance = await Grievance.findById(req.params.id)
    .populate('student', 'name institutionalId department year division email')
    .populate('assignedTeacher', 'name institutionalId department designation email')
    .populate('commonIssue', 'title description status affectedStudentCount')
    .populate('resolution.resolvedBy', 'name role')
    .populate('assignedWorker', 'name employeeId designation specialization')
    .populate('technicalDepartment', 'name code description')
    .populate('forwardedToTechnicalBy', 'name role')
    .populate('technicalWorkReport.submittedBy', 'name role')
    .populate('technicalVerification.verifiedBy', 'name role')
    .populate('technicalVerification.rejectedBy', 'name role');

  if (!grievance) {
    return res.status(404).json({ success: false, message: 'Grievance not found.' });
  }

  // Verify access
  if (req.user.role === 'student' && grievance.student._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied: Not your grievance.' });
  }

  if (req.user.role === 'teacher') {
    const isAssigned =
      grievance.assignedTeacher &&
      grievance.assignedTeacher._id.toString() === req.user._id.toString();
    const isForwarder =
      grievance.forwardedToTechnicalBy &&
      (grievance.forwardedToTechnicalBy._id
        ? grievance.forwardedToTechnicalBy._id.toString() === req.user._id.toString()
        : grievance.forwardedToTechnicalBy.toString() === req.user._id.toString());

    if (!isAssigned && !isForwarder) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not assigned to this grievance.',
      });
    }
  }

  if (req.user.role === 'worker') {
    const workerRecord = await Worker.findOne({ user: req.user._id, isActive: true });
    if (!workerRecord || !grievance.assignedWorker || grievance.assignedWorker._id.toString() !== workerRecord._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: Not your assigned grievance.' });
    }
  }

  return res.status(200).json({
    success: true,
    grievance,
  });
});

export const updateGrievanceStatus = asyncHandler(async (req, res) => {
  const { status, actionTaken, notes } = req.body;
  const grievance = await Grievance.findById(req.params.id).populate('student assignedTeacher');

  if (!grievance) {
    return res.status(404).json({ success: false, message: 'Grievance not found.' });
  }

  const validStatuses = [
    'PENDING',
    'ASSIGNED',
    'IN_PROGRESS',
    'FORWARDED_TO_TECHNICAL',
    'TECHNICAL_ASSIGNED',
    'TECHNICAL_IN_PROGRESS',
    'TECHNICAL_COMPLETED',
    'PENDING_FACULTY_VERIFICATION',
    'FACULTY_VERIFIED',
    'RESOLVED',
    'CLOSED',
    'ESCALATED',
    'REOPENED',
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status provided.' });
  }

  // Teacher permissions
  if (req.user.role === 'teacher') {
    if (
      !grievance.assignedTeacher ||
      grievance.assignedTeacher._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }
    // Escalated complaints cannot be modified by teachers
    if (grievance.status === 'ESCALATED') {
      return res.status(403).json({
        success: false,
        message: 'This complaint has been escalated to administration. Only administrators can resolve or modify escalated complaints.',
      });
    }
    // Faculty can set IN_PROGRESS or RESOLVED
    if (!['IN_PROGRESS', 'RESOLVED'].includes(status)) {
      return res.status(403).json({
        success: false,
        message: 'Faculty can only set status to IN_PROGRESS or RESOLVED.',
      });
    }
  }

  // Students cannot update status via this administrative endpoint
  if (req.user.role === 'student') {
    return res.status(403).json({
      success: false,
      message: 'Students cannot update status directly. Use close or reopen.',
    });
  }

  const prevStatus = grievance.status;
  grievance.status = status;

  if (status === 'RESOLVED') {
    grievance.resolvedAt = new Date();
    grievance.resolution = {
      actionTaken: actionTaken || 'Resolution documented by assigned officer.',
      notes: notes || '',
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
    };
  } else if (status === 'CLOSED') {
    grievance.closedAt = new Date();
  }

  await grievance.save();

  // Audit Log
  await logAudit({
    grievanceId: grievance._id,
    userId: req.user._id,
    role: req.user.role,
    action: 'STATUS_CHANGED',
    details: `Status changed from ${prevStatus} to ${status} by ${req.user.name} (${req.user.role})`,
    metadata: { prevStatus, newStatus: status, actionTaken, notes },
    ipAddress: req.ip,
  });

  // Notify student
  await createNotification({
    recipientId: grievance.student._id,
    title: `Grievance Status Updated: ${status}`,
    message: `Your grievance "${grievance.title}" status is now ${status}. ${
      status === 'RESOLVED' ? 'Please verify and provide feedback.' : ''
    }`,
    type: 'STATUS_CHANGE',
    link: `/student/grievances/${grievance._id}`,
    grievanceId: grievance._id,
  });

  return res.status(200).json({
    success: true,
    message: `Grievance status updated to ${status}.`,
    grievance,
  });
});

export const assignTeacher = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only administrators can assign grievances.',
    });
  }

  const { teacherId } = req.body;
  if (!teacherId) {
    return res.status(400).json({ success: false, message: 'Teacher ID is required.' });
  }

  const teacher = await User.findOne({ _id: teacherId, role: 'teacher', isActive: true });
  if (!teacher) {
    return res.status(404).json({ success: false, message: 'Active teacher not found.' });
  }

  const grievance = await Grievance.findById(req.params.id).populate('student');
  if (!grievance) {
    return res.status(404).json({ success: false, message: 'Grievance not found.' });
  }

  const prevTeacher = grievance.assignedTeacher;
  grievance.assignedTeacher = teacher._id;
  if (grievance.status === 'PENDING') {
    grievance.status = 'ASSIGNED';
  }
  await grievance.save();

  // Audit Log
  await logAudit({
    grievanceId: grievance._id,
    userId: req.user._id,
    role: 'admin',
    action: 'TEACHER_ASSIGNED',
    details: `Grievance ${grievance.trackingId} assigned to Prof. ${teacher.name} (${teacher.department}) by Admin ${req.user.name}`,
    metadata: { previousTeacher: prevTeacher, newTeacher: teacher._id },
    ipAddress: req.ip,
  });

  // Notify Teacher
  await createNotification({
    recipientId: teacher._id,
    title: `New Grievance Assigned: ${grievance.trackingId}`,
    message: `You have been assigned to handle grievance "${grievance.title}" (${grievance.priority} priority). 24-hour SLA applies.`,
    type: 'ASSIGNMENT',
    link: `/teacher/grievances/${grievance._id}`,
    grievanceId: grievance._id,
  });

  // Notify Student
  await createNotification({
    recipientId: grievance.student._id,
    title: 'Faculty Officer Assigned',
    message: `Prof. ${teacher.name} from ${teacher.department} has been assigned to resolve your grievance "${grievance.title}".`,
    type: 'ASSIGNMENT',
    link: `/student/grievances/${grievance._id}`,
    grievanceId: grievance._id,
  });

  return res.status(200).json({
    success: true,
    message: `Grievance assigned to ${teacher.name} successfully.`,
    grievance,
  });
});

export const reopenGrievance = asyncHandler(async (req, res) => {
  const { reopenReason } = req.body;
  if (!reopenReason || reopenReason.trim().length < 5) {
    return res.status(400).json({
      success: false,
      message: 'A clear reason is required to reopen this grievance.',
    });
  }

  const grievance = await Grievance.findById(req.params.id).populate('assignedTeacher');
  if (!grievance) {
    return res.status(404).json({ success: false, message: 'Grievance not found.' });
  }

  if (grievance.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the submitting student can reopen this grievance.' });
  }

  if (grievance.status !== 'RESOLVED') {
    return res.status(400).json({
      success: false,
      message: 'Only resolved grievances can be reopened for further investigation.',
    });
  }

  grievance.status = 'REOPENED';
  grievance.reopenedAt = new Date();
  grievance.reopenReason = reopenReason.trim();
  // Extend SLA 24 hours on reopening
  grievance.dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await grievance.save();

  // Audit Log
  await logAudit({
    grievanceId: grievance._id,
    userId: req.user._id,
    role: 'student',
    action: 'GRIEVANCE_REOPENED',
    details: `Student reopened grievance ${grievance.trackingId}. Reason: "${reopenReason.trim()}"`,
    ipAddress: req.ip,
  });

  // Notify Teacher if assigned
  if (grievance.assignedTeacher) {
    await createNotification({
      recipientId: grievance.assignedTeacher._id,
      title: `Grievance Reopened: ${grievance.trackingId}`,
      message: `Student reopened "${grievance.title}". Reason: ${reopenReason.trim()}`,
      type: 'REOPEN',
      link: `/teacher/grievances/${grievance._id}`,
      grievanceId: grievance._id,
    });
  }

  // Notify Admins
  await notifyAdmins({
    title: `Grievance Reopened: ${grievance.trackingId}`,
    message: `Student reopened "${grievance.title}". Administrative review recommended.`,
    type: 'REOPEN',
    link: `/admin/grievances/${grievance._id}`,
    grievanceId: grievance._id,
  });

  return res.status(200).json({
    success: true,
    message: 'Grievance has been reopened. Assigned officers have been alerted.',
    grievance,
  });
});

export const closeGrievance = asyncHandler(async (req, res) => {
  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) {
    return res.status(404).json({ success: false, message: 'Grievance not found.' });
  }

  if (grievance.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Unauthorized to close this grievance.' });
  }

  grievance.status = 'CLOSED';
  grievance.closedAt = new Date();
  await grievance.save();

  await logAudit({
    grievanceId: grievance._id,
    userId: req.user._id,
    role: req.user.role,
    action: 'GRIEVANCE_CLOSED',
    details: `Grievance ${grievance.trackingId} confirmed closed by ${req.user.name}.`,
    ipAddress: req.ip,
  });

  return res.status(200).json({
    success: true,
    message: 'Grievance has been closed successfully. Please rate your resolution experience.',
    grievance,
  });
});

export const deleteGrievance = asyncHandler(async (req, res) => {
  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) {
    return res.status(404).json({ success: false, message: 'Grievance not found.' });
  }

  const isAdmin = req.user.role === 'admin';
  const isStudentOwner =
    req.user.role === 'student' &&
    grievance.student.toString() === req.user._id.toString();
  const isAssignedTeacher =
    req.user.role === 'teacher' &&
    grievance.assignedTeacher &&
    grievance.assignedTeacher.toString() === req.user._id.toString();

  // Allow delete if admin OR if complaint is CLOSED and user is authorized
  if (!isAdmin && (!['CLOSED'].includes(grievance.status) || (!isStudentOwner && !isAssignedTeacher))) {
    return res.status(403).json({
      success: false,
      message: 'Complaints can only be deleted once they are CLOSED.',
    });
  }

  await Grievance.findByIdAndDelete(req.params.id);

  await logAudit({
    grievanceId: grievance._id,
    userId: req.user._id,
    role: req.user.role,
    action: 'GRIEVANCE_DELETED',
    details: `${req.user.role.toUpperCase()} ${req.user.name} deleted closed grievance ${grievance.trackingId} from database.`,
    ipAddress: req.ip,
  });

  return res.status(200).json({
    success: true,
    message: `Grievance ${grievance.trackingId} has been deleted successfully.`,
  });
});
