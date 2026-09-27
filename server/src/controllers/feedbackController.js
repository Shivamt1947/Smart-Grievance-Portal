import { z } from 'zod';
import { Feedback } from '../models/Feedback.js';
import { Grievance } from '../models/Grievance.js';
import { logAudit } from '../services/auditService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const feedbackSchema = z.object({
  grievanceId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  timelinessRating: z.number().int().min(1).max(5).optional(),
  satisfactionRating: z.number().int().min(1).max(5).optional(),
});

export const submitFeedback = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only students can submit feedback.' });
  }

  const validated = feedbackSchema.parse(req.body);

  const grievance = await Grievance.findById(validated.grievanceId);
  if (!grievance) {
    return res.status(404).json({ success: false, message: 'Grievance not found.' });
  }

  if (grievance.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied: You can only rate your own grievances.' });
  }

  if (!['RESOLVED', 'CLOSED'].includes(grievance.status)) {
    return res.status(400).json({
      success: false,
      message: 'Feedback can only be submitted for grievances that are resolved or closed.',
    });
  }

  const existingFeedback = await Feedback.findOne({ grievance: grievance._id });
  if (existingFeedback) {
    return res.status(409).json({
      success: false,
      message: 'Feedback has already been recorded for this grievance.',
    });
  }

  const feedback = await Feedback.create({
    grievance: grievance._id,
    student: req.user._id,
    rating: validated.rating,
    comment: validated.comment || '',
    timelinessRating: validated.timelinessRating,
    satisfactionRating: validated.satisfactionRating,
  });

  await logAudit({
    grievanceId: grievance._id,
    userId: req.user._id,
    role: 'student',
    action: 'FEEDBACK_SUBMITTED',
    details: `Student submitted ${validated.rating}-star feedback for ${grievance.trackingId}`,
    metadata: { rating: validated.rating },
    ipAddress: req.ip,
  });

  return res.status(201).json({
    success: true,
    message: 'Thank you! Your feedback has been recorded.',
    feedback,
  });
});

export const getFeedbackForGrievance = asyncHandler(async (req, res) => {
  const { grievanceId } = req.params;
  const feedback = await Feedback.findOne({ grievance: grievanceId }).populate(
    'student',
    'name institutionalId'
  );

  return res.status(200).json({
    success: true,
    feedback,
  });
});
