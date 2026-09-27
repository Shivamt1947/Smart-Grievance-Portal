import { Message } from '../models/Message.js';
import { Grievance } from '../models/Grievance.js';
import { createNotification, notifyAdmins } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';
import { processUploadedFile } from '../utils/fileUpload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMessagesByGrievance = asyncHandler(async (req, res) => {
  const { grievanceId } = req.params;

  const grievance = await Grievance.findById(grievanceId);
  if (!grievance) {
    return res.status(404).json({ success: false, message: 'Grievance not found.' });
  }

  // Access control
  if (req.user.role === 'student' && grievance.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  if (
    req.user.role === 'teacher' &&
    (!grievance.assignedTeacher ||
      grievance.assignedTeacher.toString() !== req.user._id.toString())
  ) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const query = { grievance: grievanceId };
  // Hide staff internal notes from students
  if (req.user.role === 'student') {
    query.isInternalNote = false;
  }

  const messages = await Message.find(query)
    .populate('sender', 'name role department institutionalId')
    .sort({ createdAt: 1 });

  return res.status(200).json({
    success: true,
    messages,
  });
});

export const postMessage = asyncHandler(async (req, res) => {
  const { grievanceId } = req.params;
  const { message, isInternalNote } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
  }

  const grievance = await Grievance.findById(grievanceId).populate('student assignedTeacher');
  if (!grievance) {
    return res.status(404).json({ success: false, message: 'Grievance not found.' });
  }

  // Role validation for access
  if (req.user.role === 'student' && grievance.student._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  if (
    req.user.role === 'teacher' &&
    (!grievance.assignedTeacher ||
      grievance.assignedTeacher._id.toString() !== req.user._id.toString())
  ) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  if (req.user.role === 'teacher' && grievance.status === 'ESCALATED') {
    return res.status(403).json({
      success: false,
      message: 'This complaint has been escalated to administration. Messaging is disabled for faculty on escalated complaints.',
    });
  }

  // Only teachers and admins can create internal staff notes
  const flagInternal = (req.user.role === 'teacher' || req.user.role === 'admin') && (isInternalNote === 'true' || isInternalNote === true);

  const attachments = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const processed = await processUploadedFile(file);
      attachments.push(processed);
    }
  }

  const newMessage = await Message.create({
    grievance: grievanceId,
    sender: req.user._id,
    senderRole: req.user.role,
    message: message.trim(),
    isInternalNote: flagInternal,
    attachments,
  });

  const populated = await Message.findById(newMessage._id).populate(
    'sender',
    'name role department institutionalId'
  );

  // Dispatch notifications if not internal note
  if (!flagInternal) {
    if (req.user.role === 'student') {
      // Notify assigned teacher
      if (grievance.assignedTeacher) {
        await createNotification({
          recipientId: grievance.assignedTeacher._id,
          title: `New Message: ${grievance.trackingId}`,
          message: `${req.user.name} sent a reply on grievance "${grievance.title}".`,
          type: 'MESSAGE',
          link: `/teacher/grievances/${grievance._id}`,
          grievanceId: grievance._id,
        });
      }
    } else {
      // Teacher or Admin sent a message -> notify student
      await createNotification({
        recipientId: grievance.student._id,
        title: `Officer Reply: ${grievance.trackingId}`,
        message: `${req.user.name} (${req.user.role}) added an update to your grievance.`,
        type: 'MESSAGE',
        link: `/student/grievances/${grievance._id}`,
        grievanceId: grievance._id,
      });
    }
  }

  // Audit Log
  await logAudit({
    grievanceId: grievance._id,
    userId: req.user._id,
    role: req.user.role,
    action: flagInternal ? 'INTERNAL_NOTE_POSTED' : 'MESSAGE_POSTED',
    details: `${req.user.name} posted ${flagInternal ? 'an internal note' : 'a message'}.`,
    ipAddress: req.ip,
  });

  return res.status(201).json({
    success: true,
    message: populated,
  });
});
