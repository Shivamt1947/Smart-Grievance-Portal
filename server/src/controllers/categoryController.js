import { Category } from '../models/Category.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCategories = asyncHandler(async (req, res) => {
  const query = req.user.role === 'admin' ? {} : { isActive: true };
  const categories = await Category.find(query).sort({ name: 1 });
  return res.status(200).json({ success: true, categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, defaultPriority, slaHours } = req.body;
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Category name is required.' });
  }

  const existing = await Category.findOne({ name: name.trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Category already exists.' });
  }

  const category = await Category.create({
    name: name.trim(),
    description: description || '',
    defaultPriority: defaultPriority || 'MEDIUM',
    slaHours: slaHours || 24,
  });

  return res.status(201).json({ success: true, category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, defaultPriority, slaHours, isActive } = req.body;
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  if (name) category.name = name.trim();
  if (description !== undefined) category.description = description;
  if (defaultPriority) category.defaultPriority = defaultPriority;
  if (slaHours) category.slaHours = slaHours;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();

  return res.status(200).json({ success: true, category });
});
