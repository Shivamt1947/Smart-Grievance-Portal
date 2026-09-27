import { Grievance } from '../models/Grievance.js';
import { Message } from '../models/Message.js';
import {
  analyzeGrievanceDraft,
  summarizeGrievance,
  studentAssistantChat,
} from '../services/ai/aiService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const assistDraft = asyncHandler(async (req, res) => {
  const { title, description, location } = req.body;

  const suggestions = await analyzeGrievanceDraft({
    title: title || '',
    description: description || '',
    location: location || '',
  });

  return res.status(200).json({
    success: true,
    suggestions,
  });
});

export const summarizeThread = asyncHandler(async (req, res) => {
  const { grievanceId } = req.body;
  if (!grievanceId) {
    return res.status(400).json({ success: false, message: 'Grievance ID required.' });
  }

  const grievance = await Grievance.findById(grievanceId);
  if (!grievance) {
    return res.status(404).json({ success: false, message: 'Grievance not found.' });
  }

  // Access check
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

  const messages = await Message.find({ grievance: grievanceId }).sort({ createdAt: 1 });
  const summary = await summarizeGrievance({ grievance, messages });

  return res.status(200).json({
    success: true,
    summary,
  });
});

export const studentAssistant = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Student AI assistant is only accessible to students.',
    });
  }

  const { query } = req.body;
  if (!query || query.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Query string required.' });
  }

  // Retrieve authorized grievances for this specific student ONLY
  const studentGrievances = await Grievance.find({ student: req.user._id })
    .select('trackingId title category location status priority dueAt')
    .sort({ createdAt: -1 })
    .limit(10);

  const answer = await studentAssistantChat({
    student: req.user,
    grievances: studentGrievances,
    query: query.trim(),
  });

  return res.status(200).json({
    success: true,
    answer,
  });
});
