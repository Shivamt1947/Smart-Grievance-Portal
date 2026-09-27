import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    grievance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      index: true,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin', 'system'],
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    details: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ grievance: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
