import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    defaultPriority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    slaHours: {
      type: Number,
      default: 24,
    },
  },
  {
    timestamps: true,
  }
);

export const Category = mongoose.model('Category', categorySchema);
