import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
} from '../controllers/categoryController.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = Router();

router.use(isAuthenticated);

router.get('/', getCategories);
router.post('/', isAdmin, createCategory);
router.patch('/:id', isAdmin, updateCategory);

export default router;
