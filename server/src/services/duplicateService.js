import { Grievance } from '../models/Grievance.js';
import { CommonIssue } from '../models/CommonIssue.js';
import { computeTextSimilarity } from './ai/aiService.js';

const ACTIVE_STATUSES = [
  'PENDING',
  'ASSIGNED',
  'IN_PROGRESS',
  'FORWARDED_TO_TECHNICAL',
  'TECHNICAL_ASSIGNED',
  'TECHNICAL_IN_PROGRESS',
  'TECHNICAL_COMPLETED',
  'PENDING_FACULTY_VERIFICATION',
  'FACULTY_VERIFIED',
  'ESCALATED',
  'REOPENED',
];

/**
 * Checks for:
 * 1. Duplicate active grievance by the SAME student
 * 2. Similar active grievances by OTHER students (potential common issue)
 */
export const checkDuplicatesAndCommonIssues = async ({
  studentId,
  title,
  description,
  category,
  location,
}) => {
  const normalizedIncomingText = `${title} ${description} ${location}`.toLowerCase();

  // Query active grievances across the institution
  const activeGrievances = await Grievance.find({
    status: { $in: ACTIVE_STATUSES },
    category,
  })
    .populate('student', 'name institutionalId department')
    .sort({ createdAt: -1 })
    .limit(100);

  let exactSameStudentDuplicate = null;
  let highestSameStudentScore = 0;

  const similarOtherStudentGrievances = [];

  for (const existing of activeGrievances) {
    const isSameStudent = existing.student._id.toString() === studentId.toString();
    const existingText = `${existing.title} ${existing.description} ${existing.location}`.toLowerCase();

    // Check location proximity / match
    const loc1 = (location || '').toLowerCase().trim();
    const loc2 = (existing.location || '').toLowerCase().trim();
    const isSameLocation = loc1.length > 2 && loc2.length > 2 && (loc1.includes(loc2) || loc2.includes(loc1));

    // Calculate semantic text similarity
    const similarity = computeTextSimilarity(normalizedIncomingText, existingText);

    // Boost similarity if locations explicitly overlap in the same category
    const adjustedScore = isSameLocation ? Math.min(1, similarity + 0.35) : similarity;

    if (isSameStudent) {
      if (adjustedScore >= 0.55 && adjustedScore > highestSameStudentScore) {
        highestSameStudentScore = adjustedScore;
        exactSameStudentDuplicate = {
          grievance: {
            id: existing._id,
            trackingId: existing.trackingId,
            title: existing.title,
            description: existing.description,
            status: existing.status,
            location: existing.location,
            category: existing.category,
            createdAt: existing.createdAt,
          },
          similarity: Math.round(adjustedScore * 100),
          isSameStudent: true,
        };
      }
    } else {
      // Complaint by a DIFFERENT student
      if (adjustedScore >= 0.5) {
        similarOtherStudentGrievances.push({
          grievance: {
            id: existing._id,
            trackingId: existing.trackingId,
            title: existing.title,
            location: existing.location,
            status: existing.status,
            createdAt: existing.createdAt,
            studentName: existing.student.name,
            department: existing.student.department,
          },
          similarity: Math.round(adjustedScore * 100),
          isSameLocation,
        });
      }
    }
  }

  // Sort other student matches by highest similarity
  similarOtherStudentGrievances.sort((a, b) => b.similarity - a.similarity);

  // Check if any existing active CommonIssue matches
  const matchingCommonIssue = await CommonIssue.findOne({
    status: { $in: ['INVESTIGATING', 'IN_PROGRESS'] },
    category,
    location: new RegExp(location ? location.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') : '', 'i'),
  });

  return {
    hasSameStudentDuplicate: !!exactSameStudentDuplicate,
    sameStudentDuplicate: exactSameStudentDuplicate,
    hasCampusWideIssues: similarOtherStudentGrievances.length > 0 || !!matchingCommonIssue,
    similarOtherStudentGrievances: similarOtherStudentGrievances.slice(0, 5),
    matchingCommonIssue: matchingCommonIssue
      ? {
          id: matchingCommonIssue._id,
          title: matchingCommonIssue.title,
          affectedStudentCount: matchingCommonIssue.affectedStudentCount,
          status: matchingCommonIssue.status,
        }
      : null,
  };
};
