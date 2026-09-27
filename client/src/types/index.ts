export type Role = 'student' | 'teacher' | 'admin' | 'worker';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  defaultSlaHours?: number;
  headTeacher?: User | null;
  isActive?: boolean;
  workerCount?: number;
  activeGrievanceCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Worker {
  _id: string;
  name: string;
  employeeId: string;
  email: string;
  phone?: string;
  department: Department | string;
  specialization?: string;
  designation: string;
  user?: User | string | null;
  isActive?: boolean;
  currentWorkload?: number;
  totalCompleted?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type GrievanceStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'FORWARDED_TO_TECHNICAL'
  | 'TECHNICAL_ASSIGNED'
  | 'TECHNICAL_IN_PROGRESS'
  | 'TECHNICAL_COMPLETED'
  | 'PENDING_FACULTY_VERIFICATION'
  | 'FACULTY_VERIFIED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ESCALATED'
  | 'REOPENED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  institutionalId: string;
  department: string;
  year?: number | null;
  division?: string | null;
  designation?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface Attachment {
  _id?: string;
  url: string;
  publicId?: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface TechnicalWorkReport {
  problem: string;
  rootCause?: string;
  workPerformed: string;
  equipmentUsed?: string;
  resolution: string;
  remarks?: string;
  evidence?: Attachment[];
  submittedAt?: string | null;
  submittedBy?: { _id: string; name: string; role: string } | null;
}

export interface TechnicalVerification {
  verifiedAt?: string | null;
  verifiedBy?: { _id: string; name: string; role: string } | null;
  rejectedAt?: string | null;
  rejectedBy?: { _id: string; name: string; role: string } | null;
  rejectionReason?: string;
}

export interface TechnicalProgressLog {
  _id?: string;
  note: string;
  updatedBy?: { _id: string; name: string; role: string } | null;
  updatedAt: string;
  workStatus?: string;
}

export interface Grievance {
  _id: string;
  trackingId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  priority: Priority;
  status: GrievanceStatus;
  student: User;
  assignedTeacher?: User | null;
  commonIssue?: {
    _id: string;
    title: string;
    status: string;
    affectedStudentCount: number;
  } | null;
  attachments: Attachment[];
  dueAt: string;
  escalatedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  reopenedAt?: string | null;
  reopenReason?: string;
  resolution?: {
    actionTaken: string;
    notes?: string;
    resolvedBy?: { _id: string; name: string; role: string } | null;
    resolvedAt?: string | null;
  };
  aiAnalysis?: {
    suggestedCategory?: string;
    suggestedPriority?: string;
    summary?: string;
    confidence?: number;
    missingInfo?: string;
  };
  isDuplicateConfirmed?: boolean;
  // Technical Workflow fields
  isTechnical?: boolean;
  forwardedToTechnicalAt?: string | null;
  forwardedToTechnicalBy?: User | null;
  technicalDepartment?: Department | null;
  assignedWorker?: Worker | null;
  workerAssignedAt?: string | null;
  workStartedAt?: string | null;
  workCompletedAt?: string | null;
  technicalWorkReport?: TechnicalWorkReport;
  technicalVerification?: TechnicalVerification;
  studentTechConfirmation?: {
    confirmedAt?: string | null;
    confirmedBy?: User | null;
    status?: string;
  };
  technicalProgressLog?: TechnicalProgressLog[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  grievance: string;
  sender: User;
  senderRole: Role;
  message: string;
  isInternalNote: boolean;
  attachments?: Attachment[];
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type: string;
  link: string;
  grievance?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface FeedbackData {
  _id: string;
  grievance: string;
  student: User;
  rating: number;
  comment?: string;
  timelinessRating?: number;
  satisfactionRating?: number;
  createdAt: string;
}

export interface CommonIssueData {
  _id: string;
  title: string;
  description?: string;
  category: string;
  location: string;
  status: 'INVESTIGATING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  affectedStudentCount: number;
  assignedTeacher?: { _id: string; name: string; department: string } | null;
  grievances?: Array<{
    _id: string;
    trackingId: string;
    title: string;
    status: GrievanceStatus;
    priority: Priority;
  }>;
  createdAt: string;
}

export interface CategoryData {
  _id: string;
  name: string;
  description: string;
  defaultPriority: Priority;
  slaHours: number;
  isActive: boolean;
}

export interface AnalyticsMetrics {
  totalGrievances: number;
  pendingCount: number;
  assignedCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  escalatedCount: number;
  reopenedCount: number;
  totalStudents: number;
  totalTeachers: number;
  commonIssuesCount: number;
  avgResolutionHours: number;
  escalationRate: number;
  averageRating: number;
  totalFeedback: number;
  priorityBreakdown: Record<string, number>;
  categoryBreakdown: Array<{ _id: string; count: number }>;
  teacherWorkloads: Array<{
    id: string;
    name: string;
    department: string;
    activeCount: number;
    resolvedCount: number;
    escalatedCount: number;
  }>;
  trendLast7Days: Array<{
    date: string;
    submissions: number;
  }>;
}

export interface AIInsight {
  type: 'CRITICAL' | 'TREND' | 'CLUSTER' | 'QUALITY' | 'STABILITY';
  title: string;
  description: string;
}

export interface AuditLogItem {
  _id: string;
  grievance?: { _id: string; trackingId: string; title: string } | null;
  user?: User | null;
  role: string;
  action: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}
