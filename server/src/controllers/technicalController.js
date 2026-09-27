import { Grievance } from '../models/Grievance.js';
import { Worker } from '../models/Worker.js';
import { User } from '../models/User.js';
import { logAudit } from '../services/auditService.js';
import { createNotification, notifyAdmins } from '../services/notificationService.js';
import { processUploadedFile } from '../utils/fileUpload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * POST /api/technical/:id/forward-technical
 * Teacher/Admin marks a grievance as technical and forwards it to the technical team.
 */
export const forwardToTechnical = asyncHandler(async (req, res) => {
  const grievance = await Grievance.findById(req.params.id).populate('student assignedTeacher');
  if (!grievance) return res.status(404).json({ success: false, message: 'Grievance not found.' });

  const { departmentId, forwardNote } = req.body;

  grievance.isTechnical = true;
  grievance.forwardedToTechnicalAt = new Date();
  grievance.forwardedToTechnicalBy = req.user._id;
  grievance.status = 'FORWARDED_TO_TECHNICAL';
  if (departmentId) grievance.technicalDepartment = departmentId;
  if (forwardNote) {
    grievance.technicalProgressLog.push({
      note: forwardNote,
      updatedBy: req.user._id,
      updatedAt: new Date(),
      workStatus: 'FORWARDED_TO_TECHNICAL',
    });
  }
  await grievance.save();

  await logAudit({
    grievanceId: grievance._id,
    userId: req.user._id,
    role: req.user.role,
    action: 'FORWARDED_TO_TECHNICAL',
    details: `Grievance ${grievance.trackingId} forwarded to Technical Team by ${req.user.name}. ${forwardNote || ''}`,
    ipAddress: req.ip,
  });

  await createNotification({
    recipientId: grievance.student._id,
    title: `Grievance Forwarded to Technical Team`,
    message: `Your grievance "${grievance.title}" has been identified as a technical issue and forwarded to the Technical Team for resolution.`,
    type: 'STATUS_CHANGE',
    link: `/student/grievances/${grievance._id}`,
    grievanceId: grievance._id,
  });

  await notifyAdmins({
    title: `Technical Forwarding: ${grievance.trackingId}`,
    message: `Grievance "${grievance.title}" has been forwarded to Technical Team by ${req.user.name}.`,
    type: 'ALERT',
    link: `/admin/grievances/${grievance._id}`,
    grievanceId: grievance._id,
  });

  return res.status(200).json({ success: true, message: 'Grievance forwarded to Technical Team.', grievance });
});

/**
 * POST /api/technical/:id/assign-worker
 * Teacher/Admin assigns a specific worker to the technical grievance.
 */
export const assignWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.body;
  if (!workerId) return res.status(400).json({ success: false, message: 'Worker ID is required.' });

  const grievance = await Grievance.findById(req.params.id).populate('student assignedTeacher');
  if (!grievance) return res.status(404).json({ success: false, message: 'Grievance not found.' });
  if (!grievance.isTechnical) return res.status(400).json({ success: false, message: 'This grievance is not marked as technical.' });

  const worker = await Worker.findOne({ _id: workerId, isActive: true });
  if (!worker) return res.status(404).json({ success: false, message: 'Active worker not found.' });

  grievance.assignedWorker = worker._id;
  grievance.workerAssignedAt = new Date();
  grievance.status = 'TECHNICAL_ASSIGNED';
  grievance.technicalProgressLog.push({
    note: `Technical staff ${worker.name} (${worker.designation}) assigned to this grievance.`,
    updatedBy: req.user._id,
    updatedAt: new Date(),
    workStatus: 'TECHNICAL_ASSIGNED',
  });
  await grievance.save();

  await Worker.findByIdAndUpdate(worker._id, { $inc: { currentWorkload: 1 } });

  await logAudit({
    grievanceId: grievance._id,
    userId: req.user._id,
    role: req.user.role,
    action: 'WORKER_ASSIGNED',
    details: `Worker ${worker.name} (${worker.employeeId}) assigned to grievance ${grievance.trackingId} by ${req.user.name}.`,
    metadata: { workerId: worker._id, workerName: worker.name },
    ipAddress: req.ip,
  });

  if (worker.user) {
    await createNotification({
      recipientId: worker.user,
      title: `New Technical Assignment: ${grievance.trackingId}`,
      message: `You have been assigned to resolve a technical grievance: "${grievance.title}". Please review and start work.`,
      type: 'ASSIGNMENT',
      link: `/teacher/technical/grievances/${grievance._id}`,
      grievanceId: grievance._id,
    });
  }

  await createNotification({
    recipientId: grievance.student._id,
    title: 'Technical Staff Assigned',
    message: `${worker.name} (${worker.designation}) has been assigned to resolve your technical issue.`,
    type: 'ASSIGNMENT',
    link: `/student/grievances/${grievance._id}`,
    grievanceId: grievance._id,
  });

  await notifyAdmins({
    title: `Worker Assigned: ${grievance.trackingId}`,
    message: `${worker.name} assigned to technical grievance "${grievance.title}".`,
    type: 'ALERT',
    link: `/admin/grievances/${grievance._id}`,
    grievanceId: grievance._id,
  });

  return res.status(200).json({ success: true, message: `Worker ${worker.name} assigned successfully.`, grievance });
});

/**
 * PATCH /api/technical/:id/start-work
 * Assigned worker marks technical work as started.
 */
export const startTechnicalWork = asyncHandler(async (req, res) => {
  const grievance = await Grievance.findById(req.params.id).populate('student assignedTeacher assignedWorker');
  if (!grievance) return res.status(404).json({ success: false, message: 'Grievance not found.' });

  const workerRecord = await Worker.findOne({ user: req.user._id, isActive: true });
  if (!workerRecord) return res.status(403).json({ success: false, message: 'Worker profile not found.' });
  if (!grievance.assignedWorker || grievance.assignedWorker._id.toString() !== workerRecord._id.toString()) {
    return res.status(403).json({ success: false, message: 'You are not assigned to this grievance.' });
  }
  if (!['TECHNICAL_ASSIGNED'].includes(grievance.status)) {
    return res.status(400).json({ success: false, message: 'Work can only be started on TECHNICAL_ASSIGNED grievances.' });
  }

  grievance.workStartedAt = new Date();
  grievance.status = 'TECHNICAL_IN_PROGRESS';
  grievance.technicalProgressLog.push({
    note: 'Technical work started by assigned staff.',
    updatedBy: req.user._id,
    updatedAt: new Date(),
    workStatus: 'TECHNICAL_IN_PROGRESS',
  });
  await grievance.save();

  await logAudit({
    grievanceId: grievance._id,
    userId: req.user._id,
    role: 'worker',
    action: 'TECHNICAL_WORK_STARTED',
    details: `Technical work started on ${grievance.trackingId} by ${req.user.name}.`,
    ipAddress: req.ip,
  });

  if (grievance.assignedTeacher) {
    await createNotification({
      recipientId: grievance.assignedTeacher._id,
      title: `Technical Work Started: ${grievance.trackingId}`,
      message: `Technical staff has started working on grievance "${grievance.title}".`,
      type: 'STATUS_CHANGE',
      link: `/teacher/grievances/${grievance._id}`,
      grievanceId: grievance._id,
    });
  }

  await createNotification({
    recipientId: grievance.student._id,
    title: 'Technical Team Started Working',
    message: `The technical team has started working on your issue: "${grievance.title}".`,
    type: 'STATUS_CHANGE',
    link: `/student/grievances/${grievance._id}`,
    grievanceId: grievance._id,
  });

  return res.status(200).json({ success: true, message: 'Technical work started.', grievance });
});

/**
 * POST /api/technical/:id/technical-progress
 * Worker or teacher adds a progress note to the technical progress log.
 */
export const addProgressUpdate = asyncHandler(async (req, res) => {
  const { note } = req.body;
  if (!note || note.trim().length < 5) {
    return res.status(400).json({ success: false, message: 'Progress note must be at least 5 characters.' });
  }

  const grievance = await Grievance.findById(req.params.id).populate('student assignedTeacher');
  if (!grievance) return res.status(404).json({ success: false, message: 'Grievance not found.' });

  // Verify this is a worker assigned to this grievance
  if (req.user.role === 'worker') {
    const workerRecord = await Worker.findOne({ user: req.user._id, isActive: true });
    if (!workerRecord || !grievance.assignedWorker || grievance.assignedWorker.toString() !== workerRecord._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this grievance.' });
    }
  }

  grievance.technicalProgressLog.push({
    note: note.trim(),
    updatedBy: req.user._id,
    updatedAt: new Date(),
    workStatus: grievance.status,
  });
  await grievance.save();

  await logAudit({
    grievanceId: grievance._id,
    userId: req.user._id,
    role: req.user.role,
    action: 'TECHNICAL_PROGRESS_UPDATE',
    details: `Progress update on ${grievance.trackingId}: "${note.trim()}"`,
    ipAddress: req.ip,
  });

  if (grievance.assignedTeacher) {
    await createNotification({
      recipientId: grievance.assignedTeacher._id,
      title: `Technical Update: ${grievance.trackingId}`,
      message: `New progress update: "${note.trim().substring(0, 100)}"`,
      type: 'ALERT',
      link: `/teacher/grievances/${grievance._id}`,
      grievanceId: grievance._id,
    });
  }

  return res.status(200).json({ success: true, message: 'Progress update added.', grievance });
});

/**
 * POST /api/technical/:id/work-report
 * Worker submits the completed work report with optional evidence files.
 */
export const submitWorkReport = asyncHandler(async (req, res) => {
  const { problem, rootCause, workPerformed, equipmentUsed, resolution, remarks } = req.body;

  if (!problem || !workPerformed || !resolution) {
    return res.status(400).json({ success: false, message: 'Problem, workPerformed, and resolution are required.' });
  }

  const grievance = await Grievance.findById(req.params.id).populate('student assignedTeacher assignedWorker');
  if (!grievance) return res.status(404).json({ success: false, message: 'Grievance not found.' });

  const workerRecord = await Worker.findOne({ user: req.user._id, isActive: true });
  if (!workerRecord || !grievance.assignedWorker || grievance.assignedWorker._id.toString() !== workerRecord._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the assigned worker can submit the work report.' });
  }

  // Process evidence attachments
  const evidence = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const processed = await processUploadedFile(file);
      evidence.push(processed);
    }
  }

  grievance.technicalWorkReport = {
    problem: problem.trim(),
    rootCause: rootCause ? rootCause.trim() : '',
    workPerformed: workPerformed.trim(),
    equipmentUsed: equipmentUsed ? equipmentUsed.trim() : '',
    resolution: resolution.trim(),
    remarks: remarks ? remarks.trim() : '',
    evidence,
    submittedAt: new Date(),
    submittedBy: req.user._id,
  };
  grievance.workCompletedAt = new Date();
  grievance.status = 'TECHNICAL_COMPLETED';
  grievance.technicalProgressLog.push({
    note: 'Technical work report submitted. Awaiting faculty verification.',
    updatedBy: req.user._id,
    updatedAt: new Date(),
    workStatus: 'TECHNICAL_COMPLETED',
  });
  await grievance.save();

  await logAudit({
    grievanceId: grievance._id,
    userId: req.user._id,
    role: 'worker',
    action: 'TECHNICAL_WORK_REPORT_SUBMITTED',
    details: `Technical work report submitted for ${grievance.trackingId} by ${req.user.name}.`,
    ipAddress: req.ip,
  });

  if (grievance.assignedTeacher) {
    await createNotification({
      recipientId: grievance.assignedTeacher._id,
      title: `Technical Work Completed: ${grievance.trackingId}`,
      message: `Technical staff has submitted the work report for "${grievance.title}". Please review and verify.`,
      type: 'ALERT',
      link: `/teacher/grievances/${grievance._id}`,
      grievanceId: grievance._id,
    });
  }

  await createNotification({
    recipientId: grievance.student._id,
    title: 'Technical Work Completed',
    message: `The technical team has completed work on "${grievance.title}". Awaiting faculty verification.`,
    type: 'STATUS_CHANGE',
    link: `/student/grievances/${grievance._id}`,
    grievanceId: grievance._id,
  });

  await notifyAdmins({
    title: `Tech Report Submitted: ${grievance.trackingId}`,
    message: `Technical work report submitted for "${grievance.title}". Pending faculty verification.`,
    type: 'ALERT',
    link: `/admin/grievances/${grievance._id}`,
    grievanceId: grievance._id,
  });

  return res.status(200).json({ success: true, message: 'Work report submitted successfully. Awaiting faculty verification.', grievance });
});

/**
 * PATCH /api/technical/:id/verify-technical
 * Teacher/Admin approves or rejects the submitted technical work report.
 */
export const verifyTechnicalWork = asyncHandler(async (req, res) => {
  const { action, rejectionReason } = req.body;
  if (!['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Action must be APPROVE or REJECT.' });
  }

  const grievance = await Grievance.findById(req.params.id).populate('student assignedTeacher assignedWorker');
  if (!grievance) return res.status(404).json({ success: false, message: 'Grievance not found.' });

  if (grievance.status !== 'TECHNICAL_COMPLETED') {
    return res.status(400).json({ success: false, message: 'Grievance must be in TECHNICAL_COMPLETED status to verify.' });
  }

  if (req.user.role === 'teacher' && (!grievance.assignedTeacher || grievance.assignedTeacher._id.toString() !== req.user._id.toString())) {
    return res.status(403).json({ success: false, message: 'You are not assigned to this grievance.' });
  }

  if (action === 'APPROVE') {
    grievance.technicalVerification = {
      ...grievance.technicalVerification,
      verifiedAt: new Date(),
      verifiedBy: req.user._id,
    };
    grievance.status = 'FACULTY_VERIFIED';
    grievance.technicalProgressLog.push({
      note: `Faculty verified the technical resolution. Student confirmation pending.`,
      updatedBy: req.user._id,
      updatedAt: new Date(),
      workStatus: 'FACULTY_VERIFIED',
    });
    await grievance.save();

    await logAudit({
      grievanceId: grievance._id,
      userId: req.user._id,
      role: req.user.role,
      action: 'FACULTY_VERIFIED_TECHNICAL',
      details: `Faculty ${req.user.name} verified technical resolution for ${grievance.trackingId}.`,
      ipAddress: req.ip,
    });

    await createNotification({
      recipientId: grievance.student._id,
      title: 'Resolution Verified by Faculty',
      message: `Your grievance "${grievance.title}" (${grievance.trackingId}) has been resolved by the Technical Team and verified by Faculty. Please confirm if your issue is resolved.`,
      type: 'STATUS_CHANGE',
      link: `/student/grievances/${grievance._id}`,
      grievanceId: grievance._id,
    });

    await notifyAdmins({
      title: `Faculty Verified: ${grievance.trackingId}`,
      message: `Technical work verified for "${grievance.title}". Awaiting student confirmation.`,
      type: 'ALERT',
      link: `/admin/grievances/${grievance._id}`,
      grievanceId: grievance._id,
    });

    return res.status(200).json({ success: true, message: 'Technical work verified. Student has been notified for confirmation.', grievance });
  }

  // REJECT
  if (!rejectionReason || rejectionReason.trim().length < 5) {
    return res.status(400).json({ success: false, message: 'A reason is required when rejecting technical work.' });
  }

  grievance.technicalVerification = {
    ...grievance.technicalVerification,
    rejectedAt: new Date(),
    rejectedBy: req.user._id,
    rejectionReason: rejectionReason.trim(),
  };
  grievance.status = 'TECHNICAL_ASSIGNED';
  grievance.technicalProgressLog.push({
    note: `Faculty rejected technical resolution. Reason: ${rejectionReason.trim()}`,
    updatedBy: req.user._id,
    updatedAt: new Date(),
    workStatus: 'TECHNICAL_ASSIGNED',
  });
  await grievance.save();

  await logAudit({
    grievanceId: grievance._id,
    userId: req.user._id,
    role: req.user.role,
    action: 'FACULTY_REJECTED_TECHNICAL',
    details: `Faculty ${req.user.name} rejected technical resolution for ${grievance.trackingId}. Reason: ${rejectionReason.trim()}`,
    ipAddress: req.ip,
  });

  const workerUser = grievance.assignedWorker && grievance.assignedWorker.user ? grievance.assignedWorker.user : null;
  if (workerUser) {
    await createNotification({
      recipientId: workerUser,
      title: `Technical Work Rejected: ${grievance.trackingId}`,
      message: `Faculty has rejected your technical resolution for "${grievance.title}". Reason: ${rejectionReason.trim()}. Please review and resubmit.`,
      type: 'ALERT',
      link: `/teacher/technical/grievances/${grievance._id}`,
      grievanceId: grievance._id,
    });
  }

  return res.status(200).json({ success: true, message: 'Technical work rejected. Worker has been notified.', grievance });
});

/**
 * POST /api/technical/:id/confirm-resolution
 * Student confirms the technical resolution, closing the grievance.
 */
export const confirmTechnicalResolution = asyncHandler(async (req, res) => {
  const grievance = await Grievance.findById(req.params.id).populate('assignedWorker assignedTeacher');
  if (!grievance) return res.status(404).json({ success: false, message: 'Grievance not found.' });

  if (grievance.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the student who submitted this grievance can confirm resolution.' });
  }

  if (grievance.status !== 'FACULTY_VERIFIED') {
    return res.status(400).json({ success: false, message: 'Resolution can only be confirmed after faculty verification.' });
  }

  grievance.studentTechConfirmation = {
    confirmedAt: new Date(),
    confirmedBy: req.user._id,
    status: 'CONFIRMED',
  };
  grievance.status = 'CLOSED';
  grievance.closedAt = new Date();
  grievance.technicalProgressLog.push({
    note: 'Student confirmed the technical resolution. Grievance closed.',
    updatedBy: req.user._id,
    updatedAt: new Date(),
    workStatus: 'CLOSED',
  });
  await grievance.save();

  // Update worker stats
  if (grievance.assignedWorker && grievance.assignedWorker._id) {
    await Worker.findByIdAndUpdate(grievance.assignedWorker._id, {
      $inc: { currentWorkload: -1, totalCompleted: 1 },
    });
  }

  await logAudit({
    grievanceId: grievance._id,
    userId: req.user._id,
    role: 'student',
    action: 'STUDENT_CONFIRMED_RESOLUTION',
    details: `Student confirmed technical resolution for ${grievance.trackingId}. Grievance closed.`,
    ipAddress: req.ip,
  });

  if (grievance.assignedTeacher) {
    await createNotification({
      recipientId: grievance.assignedTeacher._id,
      title: `Grievance Closed: ${grievance.trackingId}`,
      message: `Student confirmed the resolution for "${grievance.title}". Grievance is now closed.`,
      type: 'STATUS_CHANGE',
      link: `/teacher/grievances/${grievance._id}`,
      grievanceId: grievance._id,
    });
  }

  await notifyAdmins({
    title: `Grievance Closed: ${grievance.trackingId}`,
    message: `Technical grievance "${grievance.title}" confirmed resolved by student and closed.`,
    type: 'STATUS_CHANGE',
    link: `/admin/grievances/${grievance._id}`,
    grievanceId: grievance._id,
  });

  return res.status(200).json({ success: true, message: 'Resolution confirmed. Grievance closed successfully.', grievance });
});

/**
 * GET /api/technical/stats
 * Dedicated endpoint returning real aggregate database metrics for technical grievances.
 */
export const getTechnicalStats = asyncHandler(async (req, res) => {
  const query = { isTechnical: true };

  if (req.user.role === 'teacher') {
    query.$or = [
      { assignedTeacher: req.user._id },
      { forwardedToTechnicalBy: req.user._id },
    ];
  } else if (req.user.role === 'worker') {
    const workerRecord = await Worker.findOne({ user: req.user._id, isActive: true });
    if (workerRecord) {
      query.assignedWorker = workerRecord._id;
    } else {
      query._id = null;
    }
  }

  const forwardedCount = await Grievance.countDocuments({ ...query, status: 'FORWARDED_TO_TECHNICAL' });
  const assignedCount = await Grievance.countDocuments({ ...query, status: 'TECHNICAL_ASSIGNED' });
  const inProgressCount = await Grievance.countDocuments({ ...query, status: 'TECHNICAL_IN_PROGRESS' });
  const pendingVerificationCount = await Grievance.countDocuments({ ...query, status: 'TECHNICAL_COMPLETED' });
  const completedCount = await Grievance.countDocuments({
    ...query,
    status: { $in: ['FACULTY_VERIFIED', 'CLOSED'] },
  });
  const totalCount = await Grievance.countDocuments(query);

  return res.status(200).json({
    success: true,
    stats: {
      forwardedCount,
      assignedCount,
      inProgressCount,
      pendingVerificationCount,
      completedCount,
      totalCount,
    },
  });
});

/**
 * GET /api/technical
 * Get all technical grievances, scoped by role.
 */
export const getTechnicalGrievances = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
  const skip = (page - 1) * limit;
  const { status } = req.query;

  const query = { isTechnical: true };

  if (req.user.role === 'teacher') {
    query.$or = [
      { assignedTeacher: req.user._id },
      { forwardedToTechnicalBy: req.user._id },
    ];
  } else if (req.user.role === 'worker') {
    const workerRecord = await Worker.findOne({ user: req.user._id, isActive: true });
    if (!workerRecord) {
      return res.status(200).json({ success: true, grievances: [], pagination: { total: 0, page, limit, pages: 1 } });
    }
    query.assignedWorker = workerRecord._id;
  }
  // Admin and Teacher can see all technical grievances in technical workspace

  if (status && status !== 'ALL') {
    query.status = status;
  }

  const total = await Grievance.countDocuments(query);
  const grievances = await Grievance.find(query)
    .populate('student', 'name institutionalId department')
    .populate('assignedTeacher', 'name department')
    .populate('assignedWorker', 'name designation specialization')
    .populate('technicalDepartment', 'name code')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.status(200).json({
    success: true,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    grievances,
  });
});

/**
 * GET /api/technical/worker-dashboard
 * Worker's personal dashboard with stats and recent assignments.
 */
export const getWorkerDashboard = asyncHandler(async (req, res) => {
  if (req.user.role !== 'worker') {
    return res.status(403).json({ success: false, message: 'Worker access only.' });
  }

  const workerRecord = await Worker.findOne({ user: req.user._id, isActive: true }).populate('department', 'name code');
  if (!workerRecord) {
    return res.status(404).json({ success: false, message: 'Worker profile not found.' });
  }

  const assignedCount = await Grievance.countDocuments({ assignedWorker: workerRecord._id, status: 'TECHNICAL_ASSIGNED' });
  const inProgressCount = await Grievance.countDocuments({ assignedWorker: workerRecord._id, status: 'TECHNICAL_IN_PROGRESS' });
  const completedCount = await Grievance.countDocuments({ assignedWorker: workerRecord._id, status: { $in: ['TECHNICAL_COMPLETED', 'FACULTY_VERIFIED', 'CLOSED'] } });
  const pendingVerificationCount = await Grievance.countDocuments({ assignedWorker: workerRecord._id, status: 'TECHNICAL_COMPLETED' });

  const recentGrievances = await Grievance.find({ assignedWorker: workerRecord._id })
    .populate('student', 'name institutionalId')
    .sort({ createdAt: -1 })
    .limit(5);

  return res.status(200).json({
    success: true,
    worker: workerRecord,
    stats: { assignedCount, inProgressCount, completedCount, pendingVerificationCount },
    recentGrievances,
  });
});
