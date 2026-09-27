import { Worker } from '../models/Worker.js';
import { Department } from '../models/Department.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all workers (filterable by department & isActive)
// @route   GET /api/workers
// @access  Private
export const getWorkers = asyncHandler(async (req, res) => {
  const { department, isActive, search } = req.query;

  const query = {};

  if (department) {
    query.department = department;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  } else {
    query.isActive = true;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
      { designation: { $regex: search, $options: 'i' } },
      { specialization: { $regex: search, $options: 'i' } },
    ];
  }

  const workers = await Worker.find(query)
    .populate('department', 'name code')
    .populate('user', 'email name avatarUrl')
    .sort({ currentWorkload: 1, name: 1 })
    .lean();

  res.status(200).json({
    success: true,
    count: workers.length,
    workers,
  });
});

// @desc    Get worker by ID
// @route   GET /api/workers/:id
// @access  Private
export const getWorkerById = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id)
    .populate('department', 'name code defaultSlaHours')
    .populate('user', 'email name avatarUrl role')
    .lean();

  if (!worker) {
    return res.status(404).json({ success: false, message: 'Worker not found' });
  }

  res.status(200).json({
    success: true,
    worker,
  });
});

// @desc    Create a new worker (Admin only)
// @route   POST /api/workers
// @access  Private (Admin only)
export const createWorker = asyncHandler(async (req, res) => {
  const { name, employeeId, email, phone, departmentId, designation, specialization, password } = req.body;

  if (!name || !employeeId || !email || !departmentId || !designation) {
    return res.status(400).json({
      success: false,
      message: 'Name, employee ID, email, department, and designation are required',
    });
  }

  const dept = await Department.findById(departmentId);
  if (!dept) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }

  const existingWorker = await Worker.findOne({
    $or: [{ employeeId: employeeId.trim().toUpperCase() }, { email: email.trim().toLowerCase() }],
  });

  if (existingWorker) {
    return res.status(400).json({
      success: false,
      message: 'A worker with this Employee ID or Email already exists',
    });
  }

  // Optionally create worker User account if password is provided
  let userId = null;
  const existingUser = await User.findOne({ email: email.trim().toLowerCase() });

  if (existingUser) {
    userId = existingUser._id;
  } else if (password) {
    const newUser = new User({
      institutionalId: employeeId.trim().toUpperCase(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'worker',
      department: dept.name,
      isVerified: true,
      isActive: true,
    });
    await User.register(newUser, password);
    userId = newUser._id;
  }

  const worker = await Worker.create({
    name: name.trim(),
    employeeId: employeeId.trim().toUpperCase(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '',
    department: dept._id,
    designation: designation.trim(),
    specialization: specialization ? specialization.trim() : '',
    user: userId,
  });

  const populatedWorker = await Worker.findById(worker._id).populate('department', 'name code');

  res.status(201).json({
    success: true,
    message: 'Worker created successfully',
    worker: populatedWorker,
  });
});

// @desc    Update worker details
// @route   PATCH /api/workers/:id
// @access  Private (Admin only)
export const updateWorker = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id);

  if (!worker) {
    return res.status(404).json({ success: false, message: 'Worker not found' });
  }

  const { name, phone, departmentId, designation, specialization, isActive } = req.body;

  if (name) worker.name = name.trim();
  if (phone !== undefined) worker.phone = phone.trim();
  if (designation) worker.designation = designation.trim();
  if (specialization !== undefined) worker.specialization = specialization.trim();
  if (isActive !== undefined) worker.isActive = isActive;

  if (departmentId) {
    const dept = await Department.findById(departmentId);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Target department not found' });
    }
    worker.department = dept._id;
  }

  await worker.save();

  const updated = await Worker.findById(worker._id).populate('department', 'name code');

  res.status(200).json({
    success: true,
    message: 'Worker updated successfully',
    worker: updated,
  });
});

// @desc    Delete / Deactivate worker
// @route   DELETE /api/workers/:id
// @access  Private (Admin only)
export const deleteWorker = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id);

  if (!worker) {
    return res.status(404).json({ success: false, message: 'Worker not found' });
  }

  worker.isActive = false;
  await worker.save();

  res.status(200).json({
    success: true,
    message: 'Worker deactivated successfully',
  });
});
