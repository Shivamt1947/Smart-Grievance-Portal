import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    grievance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      required: true,
      unique: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    timelinessRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Feedback = mongoose.model('Feedback', feedbackSchema);
