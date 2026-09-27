import mongoose from 'mongoose';

const approvedStudentSchema = new mongoose.Schema(
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
    year: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    division: {
      type: String,
      required: true,
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

export const ApprovedStudent = mongoose.model('ApprovedStudent', approvedStudentSchema);
