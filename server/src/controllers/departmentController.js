import { Department } from '../models/Department.js';
import { Worker } from '../models/Worker.js';
import { Grievance } from '../models/Grievance.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all departments (authenticated)
// @route   GET /api/departments
// @access  Private
export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ isActive: true })
    .populate('headTeacher', 'name email department')
    .sort({ name: 1 })
    .lean();

  // Attach worker count and active grievance count for each department
  const departmentsWithCounts = await Promise.all(
    departments.map(async (dept) => {
      const workerCount = await Worker.countDocuments({
        department: dept._id,
        isActive: true,
      });

      const activeGrievanceCount = await Grievance.countDocuments({
        department: dept._id,
        status: { $in: ['ASSIGNED_TO_WORKER', 'WORK_IN_PROGRESS', 'TEACHER_VERIFICATION'] },
      });

      return {
        ...dept,
        workerCount,
        activeGrievanceCount,
      };
    })
  );

  res.status(200).json({
    success: true,
    count: departmentsWithCounts.length,
    departments: departmentsWithCounts,
  });
});

// @desc    Get department by ID
// @route   GET /api/departments/:id
// @access  Private
export const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id)
    .populate('headTeacher', 'name email department')
    .lean();

  if (!department) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }

  const workers = await Worker.find({ department: department._id, isActive: true })
    .populate('user', 'name email avatarUrl')
    .sort({ currentWorkload: 1 });

  res.status(200).json({
    success: true,
    department: {
      ...department,
      workers,
    },
  });
});

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private (Admin only)
export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, defaultSlaHours, headTeacher } = req.body;

  if (!name || !code) {
    return res.status(400).json({ success: false, message: 'Department name and code are required' });
  }

  const existingDept = await Department.findOne({
    $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
  });

  if (existingDept) {
    return res.status(400).json({ success: false, message: 'Department with this name or code already exists' });
  }

  const department = await Department.create({
    name: name.trim(),
    code: code.trim().toUpperCase(),
    description: description || '',
    defaultSlaHours: defaultSlaHours || 24,
    headTeacher: headTeacher || null,
  });

  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    department,
  });
});

// @desc    Update department
// @route   PATCH /api/departments/:id
// @access  Private (Admin only)
export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }

  const { name, code, description, defaultSlaHours, headTeacher, isActive } = req.body;

  if (name) department.name = name.trim();
  if (code) department.code = code.trim().toUpperCase();
  if (description !== undefined) department.description = description;
  if (defaultSlaHours) department.defaultSlaHours = defaultSlaHours;
  if (headTeacher !== undefined) department.headTeacher = headTeacher;
  if (isActive !== undefined) department.isActive = isActive;

  await department.save();

  res.status(200).json({
    success: true,
    message: 'Department updated successfully',
    department,
  });
});

// @desc    Delete/Deactivate department
// @route   DELETE /api/departments/:id
// @access  Private (Admin only)
export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }

  department.isActive = false;
  await department.save();

  res.status(200).json({
    success: true,
    message: 'Department deactivated successfully',
  });
});
