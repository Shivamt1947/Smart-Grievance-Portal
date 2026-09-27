import mongoose from 'mongoose';

const approvedTeacherSchema = new mongoose.Schema(
  {
    institutionalId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    designation: {
      type: String,
      default: 'Assistant Professor',
      trim: true,
    },
    isClaimed: {
      type: Boolean,
      default: false,
      index: true,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const ApprovedTeacher = mongoose.model('ApprovedTeacher', approvedTeacherSchema);
