import passport from 'passport';
import { z } from 'zod';
import { User } from '../models/User.js';
import { ApprovedStudent } from '../models/ApprovedStudent.js';
import { ApprovedTeacher } from '../models/ApprovedTeacher.js';
import { logAudit } from '../services/auditService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const registerStudentSchema = z.object({
  role: z.literal('student'),
  institutionalId: z.string().min(3).max(30),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  department: z.string().min(2),
  year: z.number().int().min(1).max(5),
  division: z.string().min(1).max(10),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerTeacherSchema = z.object({
  role: z.literal('teacher'),
  institutionalId: z.string().min(3).max(30),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  department: z.string().min(2),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const register = asyncHandler(async (req, res, next) => {
  const { role } = req.body;

  if (role === 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin accounts cannot be self-registered. Contact system administrator.',
    });
  }

  let validatedData;
  if (role === 'student') {
    validatedData = registerStudentSchema.parse(req.body);
  } else if (role === 'teacher') {
    validatedData = registerTeacherSchema.parse(req.body);
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid role specified. Must be student or teacher.',
    });
  }

  const normalizedId = validatedData.institutionalId.trim().toUpperCase();
  const normalizedEmail = validatedData.email.trim().toLowerCase();

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ institutionalId: normalizedId }, { email: normalizedEmail }],
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'An account with this institutional ID or email is already registered.',
    });
  }

  // Institutional Whitelist Verification
  if (role === 'student') {
    const approvedRecord = await ApprovedStudent.findOne({
      institutionalId: normalizedId,
    });

    if (!approvedRecord) {
      return res.status(403).json({
        success: false,
        message: `Institutional verification failed: Student ID "${normalizedId}" is not in the approved university roster.`,
      });
    }

    if (approvedRecord.isClaimed) {
      return res.status(409).json({
        success: false,
        message: 'This institutional student ID has already been registered and claimed.',
      });
    }

    // Verify institutional email matches record or domain
    if (approvedRecord.email.toLowerCase() !== normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: `Registration email does not match official record for ID "${normalizedId}". Expected: ${approvedRecord.email}`,
      });
    }

    // Create student user
    const newUser = new User({
      institutionalId: normalizedId,
      name: approvedRecord.name || validatedData.name,
      email: normalizedEmail,
      role: 'student',
      department: approvedRecord.department || validatedData.department,
      year: approvedRecord.year || validatedData.year,
      division: approvedRecord.division || validatedData.division,
      isVerified: true,
      isActive: true,
    });

    await User.register(newUser, validatedData.password);

    // Mark approved record as claimed
    approvedRecord.isClaimed = true;
    approvedRecord.claimedAt = new Date();
    await approvedRecord.save();

    await logAudit({
      userId: newUser._id,
      role: 'student',
      action: 'USER_REGISTERED',
      details: `Student registered: ${newUser.name} (${newUser.institutionalId}) - ${newUser.department}`,
      ipAddress: req.ip,
    });

    // Auto-login after registration
    req.login(newUser, (err) => {
      if (err) return next(err);
      return res.status(201).json({
        success: true,
        message: 'Student account registered and authenticated successfully.',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          institutionalId: newUser.institutionalId,
          department: newUser.department,
          year: newUser.year,
          division: newUser.division,
        },
      });
    });
  } else if (role === 'teacher') {
    const approvedRecord = await ApprovedTeacher.findOne({
      institutionalId: normalizedId,
    });

    if (!approvedRecord) {
      return res.status(403).json({
        success: false,
        message: `Institutional verification failed: Staff ID "${normalizedId}" is not in the approved faculty database.`,
      });
    }

    if (approvedRecord.isClaimed) {
      return res.status(409).json({
        success: false,
        message: 'This faculty ID has already been registered and claimed.',
      });
    }

    if (approvedRecord.email.toLowerCase() !== normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: `Registration email does not match official faculty record for ID "${normalizedId}". Expected: ${approvedRecord.email}`,
      });
    }

    const newUser = new User({
      institutionalId: normalizedId,
      name: approvedRecord.name || validatedData.name,
      email: normalizedEmail,
      role: 'teacher',
      department: approvedRecord.department || validatedData.department,
      isVerified: true,
      isActive: true,
    });

    await User.register(newUser, validatedData.password);

    approvedRecord.isClaimed = true;
    approvedRecord.claimedAt = new Date();
    await approvedRecord.save();

    await logAudit({
      userId: newUser._id,
      role: 'teacher',
      action: 'USER_REGISTERED',
      details: `Faculty member registered: ${newUser.name} (${newUser.institutionalId}) - ${newUser.department}`,
      ipAddress: req.ip,
    });

    req.login(newUser, (err) => {
      if (err) return next(err);
      return res.status(201).json({
        success: true,
        message: 'Faculty account registered and authenticated successfully.',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          institutionalId: newUser.institutionalId,
          department: newUser.department,
        },
      });
    });
  }
});

export const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Invalid institutional email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact the administrator.',
      });
    }

    req.login(user, async (loginErr) => {
      if (loginErr) return next(loginErr);

      await logAudit({
        userId: user._id,
        role: user.role,
        action: 'USER_LOGIN',
        details: `${user.role.toUpperCase()} logged in: ${user.name} (${user.email})`,
        ipAddress: req.ip,
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          institutionalId: user.institutionalId,
          department: user.department,
          year: user.year,
          division: user.division,
        },
      });
    });
  })(req, res, next);
};

export const logout = (req, res, next) => {
  if (req.user) {
    const userId = req.user._id;
    const role = req.user.role;
    const name = req.user.name;

    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error('[Session Error] Destroy failed:', destroyErr.message);
        }
        res.clearCookie('connect.sid');

        logAudit({
          userId,
          role,
          action: 'USER_LOGOUT',
          details: `User logged out: ${name}`,
          ipAddress: req.ip,
        });

        return res.status(200).json({
          success: true,
          message: 'Logged out successfully.',
        });
      });
    });
  } else {
    return res.status(200).json({
      success: true,
      message: 'Already logged out.',
    });
  }
};

export const getMe = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated.',
    });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      institutionalId: req.user.institutionalId,
      department: req.user.department,
      year: req.user.year,
      division: req.user.division,
      createdAt: req.user.createdAt,
    },
  });
};
