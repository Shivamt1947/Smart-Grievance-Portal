import mongoose from 'mongoose';

const commonIssueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
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
    status: {
      type: String,
      enum: ['INVESTIGATING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'INVESTIGATING',
      index: true,
    },
    assignedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    affectedStudentCount: {
      type: Number,
      default: 1,
    },
    grievances: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grievance',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const CommonIssue = mongoose.model('CommonIssue', commonIssueSchema);
