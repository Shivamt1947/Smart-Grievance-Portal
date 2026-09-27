import { Router } from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = Router();

router.use(isAuthenticated);

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.post('/', isAdmin, createDepartment);
router.patch('/:id', isAdmin, updateDepartment);
router.delete('/:id', isAdmin, deleteDepartment);

export default router;
