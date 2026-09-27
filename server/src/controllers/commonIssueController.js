import { CommonIssue } from '../models/CommonIssue.js';
import { Grievance } from '../models/Grievance.js';
import { logAudit } from '../services/auditService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCommonIssues = asyncHandler(async (req, res) => {
  const issues = await CommonIssue.find()
    .populate('assignedTeacher', 'name department designation')
    .populate('grievances', 'trackingId title status priority student')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    commonIssues: issues,
  });
});

export const createCommonIssue = asyncHandler(async (req, res) => {
  const { title, description, category, location, grievanceIds, assignedTeacher } = req.body;

  if (!title || !category || !location) {
    return res.status(400).json({
      success: false,
      message: 'Title, category, and location are required to declare a common campus issue.',
    });
  }

  const ids = Array.isArray(grievanceIds) ? grievanceIds : [];

  const commonIssue = await CommonIssue.create({
    title: title.trim(),
    description: description ? description.trim() : '',
    category: category.trim(),
    location: location.trim(),
    grievances: ids,
    affectedStudentCount: Math.max(1, ids.length),
    assignedTeacher: assignedTeacher || null,
    createdBy: req.user._id,
  });

  if (ids.length > 0) {
    await Grievance.updateMany(
      { _id: { $in: ids } },
      { $set: { commonIssue: commonIssue._id } }
    );
  }

  await logAudit({
    userId: req.user._id,
    role: 'admin',
    action: 'COMMON_ISSUE_CREATED',
    details: `Common Campus Issue declared: "${title}" in ${category} (${location}) linking ${ids.length} grievances.`,
    ipAddress: req.ip,
  });

  return res.status(201).json({
    success: true,
    message: 'Common issue created and linked successfully.',
    commonIssue,
  });
});

export const updateCommonIssueStatus = asyncHandler(async (req, res) => {
  const { status, resolvedAt } = req.body;
  const issue = await CommonIssue.findById(req.params.id);

  if (!issue) {
    return res.status(404).json({ success: false, message: 'Common issue not found.' });
  }

  issue.status = status;
  if (status === 'RESOLVED') {
    issue.resolvedAt = resolvedAt || new Date();
  }
  await issue.save();

  await logAudit({
    userId: req.user._id,
    role: 'admin',
    action: 'COMMON_ISSUE_UPDATED',
    details: `Common issue "${issue.title}" status changed to ${status}.`,
    ipAddress: req.ip,
  });

  return res.status(200).json({
    success: true,
    message: `Common issue status updated to ${status}.`,
    commonIssue: issue,
  });
});
