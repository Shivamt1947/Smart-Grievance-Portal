import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    grievance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isInternalNote: {
      type: Boolean,
      default: false,
      index: true,
    },
    attachments: [
      {
        url: String,
        filename: String,
        size: Number,
        mimeType: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ grievance: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
