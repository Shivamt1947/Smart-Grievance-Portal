import { Grievance } from '../models/Grievance.js';

export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administration.',
      });
    }
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please log in to proceed.',
  });
};

export const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}] roles.`,
      });
    }

    next();
  };
};

export const isStudent = hasRole('student');
export const isTeacher = hasRole('teacher');
export const isAdmin = hasRole('admin');
export const isStaffOrAdmin = hasRole('teacher', 'admin');

export const canAccessGrievance = async (req, res, next) => {
  try {
    const grievanceId = req.params.id || req.params.grievanceId;
    if (!grievanceId) {
      return res.status(400).json({ success: false, message: 'Grievance ID required.' });
    }

    const grievance = await Grievance.findById(grievanceId);
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }

    // Admins have campus-wide oversight
    if (req.user.role === 'admin') {
      req.grievance = grievance;
      return next();
    }

    // Students can ONLY access their own grievances
    if (req.user.role === 'student') {
      if (grievance.student.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only view your own grievances.',
        });
      }
      req.grievance = grievance;
      return next();
    }

    // Teachers can ONLY access grievances assigned to them by Admin or forwarded by them
    if (req.user.role === 'teacher') {
      const isAssigned =
        grievance.assignedTeacher &&
        grievance.assignedTeacher.toString() === req.user._id.toString();
      const isForwarder =
        grievance.forwardedToTechnicalBy &&
        grievance.forwardedToTechnicalBy.toString() === req.user._id.toString();

      if (!isAssigned && !isForwarder) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not assigned to this grievance.',
        });
      }
      req.grievance = grievance;
      return next();
    }

    // Workers can access technical grievances assigned to them
    if (req.user.role === 'worker') {
      const { Worker } = await import('../models/Worker.js');
      const workerRecord = await Worker.findOne({ user: req.user._id, isActive: true });
      if (!workerRecord) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Worker profile not found.',
        });
      }
      if (
        !grievance.isTechnical ||
        !grievance.assignedWorker ||
        grievance.assignedWorker.toString() !== workerRecord._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: This technical grievance is not assigned to you.',
        });
      }
      req.grievance = grievance;
      req.workerRecord = workerRecord;
      return next();
    }

    return res.status(403).json({ success: false, message: 'Unauthorized role.' });
  } catch (error) {
    next(error);
  }
};

export const isWorker = hasRole('worker');
export const isTechnicalOrAdmin = hasRole('worker', 'admin');
export const isTeacherOrAdmin = hasRole('teacher', 'admin');
