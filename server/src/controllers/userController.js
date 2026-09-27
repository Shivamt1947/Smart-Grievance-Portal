import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAvailableTeachers = asyncHandler(async (req, res) => {
  const teachers = await User.find({ role: 'teacher', isActive: true })
    .select('name email department institutionalId')
    .sort({ name: 1 });

  return res.status(200).json({
    success: true,
    teachers,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, department, year, division } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (name) user.name = name.trim();
  if (department && req.user.role === 'admin') user.department = department.trim();
  if (year && req.user.role === 'student') user.year = parseInt(year, 10);
  if (division && req.user.role === 'student') user.division = division.trim();

  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
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

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long.',
    });
  }

  const user = await User.findById(req.user._id);
  user.changePassword(oldPassword, newPassword, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Current password was incorrect.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  });
});
