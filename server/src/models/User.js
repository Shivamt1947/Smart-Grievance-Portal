import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

const userSchema = new mongoose.Schema(
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
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin', 'worker'],
      required: true,
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
      min: 1,
      max: 5,
      default: null,
    },
    division: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const plm = (passportLocalMongoose && passportLocalMongoose.default) ? passportLocalMongoose.default : passportLocalMongoose;

userSchema.plugin(plm, {
  usernameField: 'email',
  errorMessages: {
    UserExistsError: 'A user with the given institutional email is already registered.',
    IncorrectPasswordError: 'Password or email is incorrect.',
    IncorrectUsernameError: 'Password or email is incorrect.',
  },
});

export const User = mongoose.model('User', userSchema);
