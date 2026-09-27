import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'SUBMISSION',
        'ASSIGNMENT',
        'STATUS_CHANGE',
        'MESSAGE',
        'ESCALATION',
        'FEEDBACK',
        'ALERT',
        'REOPEN',
      ],
      default: 'ALERT',
    },
    link: {
      type: String,
      required: true,
    },
    grievance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
