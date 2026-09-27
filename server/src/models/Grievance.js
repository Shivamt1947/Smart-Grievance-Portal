import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    filename: { type: String, required: true },
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: '' },
  },
  { _id: true }
);

const grievanceSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: [
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
      ],
      default: 'PENDING',
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    commonIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommonIssue',
      default: null,
      index: true,
    },
    attachments: [attachmentSchema],
    embedding: {
      type: [Number],
      default: undefined,
    },
    aiAnalysis: {
      suggestedCategory: { type: String, default: '' },
      suggestedPriority: { type: String, default: '' },
      summary: { type: String, default: '' },
      keywords: { type: [String], default: [] },
      confidence: { type: Number, default: 0 },
      missingInfo: { type: String, default: '' },
    },
    dueAt: {
      type: Date,
      required: true,
      index: true,
    },
    escalatedAt: {
      type: Date,
      default: null,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    reopenedAt: {
      type: Date,
      default: null,
    },
    reopenReason: {
      type: String,
      default: '',
    },
    resolution: {
      actionTaken: { type: String, default: '' },
      notes: { type: String, default: '' },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      resolvedAt: { type: Date, default: null },
    },
    isDuplicateConfirmed: {
      type: Boolean,
      default: false,
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      default: null,
    },
    // Technical Routing
    isTechnical: {
      type: Boolean,
      default: false,
      index: true,
    },
    forwardedToTechnicalAt: {
      type: Date,
      default: null,
    },
    forwardedToTechnicalBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    technicalDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      default: null,
    },
    workerAssignedAt: {
      type: Date,
      default: null,
    },
    workStartedAt: {
      type: Date,
      default: null,
    },
    workCompletedAt: {
      type: Date,
      default: null,
    },
    technicalWorkReport: {
      problem: { type: String, default: '' },
      rootCause: { type: String, default: '' },
      workPerformed: { type: String, default: '' },
      equipmentUsed: { type: String, default: '' },
      resolution: { type: String, default: '' },
      remarks: { type: String, default: '' },
      evidence: [{
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
        filename: { type: String, required: true },
        size: { type: Number, default: 0 },
        mimeType: { type: String, default: '' },
      }],
      submittedAt: { type: Date, default: null },
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },
    technicalVerification: {
      verifiedAt: { type: Date, default: null },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      rejectedAt: { type: Date, default: null },
      rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      rejectionReason: { type: String, default: '' },
    },
    studentTechConfirmation: {
      confirmedAt: { type: Date, default: null },
      confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      status: {
        type: String,
        enum: ['CONFIRMED', 'REOPENED', ''],
        default: '',
      },
    },
    technicalProgressLog: [{
      note: { type: String, required: true },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      updatedAt: { type: Date, default: Date.now },
      workStatus: { type: String, default: '' },
    }],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-frequency queries
grievanceSchema.index({ student: 1, status: 1 });
grievanceSchema.index({ assignedTeacher: 1, status: 1 });
grievanceSchema.index({ category: 1, priority: 1 });
grievanceSchema.index({ status: 1, dueAt: 1 });
grievanceSchema.index({ createdAt: -1 });
grievanceSchema.index({ isTechnical: 1, status: 1 });
grievanceSchema.index({ assignedWorker: 1, status: 1 });
grievanceSchema.index({ technicalDepartment: 1, status: 1 });

export const Grievance = mongoose.model('Grievance', grievanceSchema);
