import { Router } from 'express';
import {
  getAvailableTeachers,
  updateProfile,
  changePassword,
} from '../controllers/userController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

router.use(isAuthenticated);

router.get('/teachers', getAvailableTeachers);
router.patch('/profile', updateProfile);
router.post('/change-password', changePassword);

export default router;
