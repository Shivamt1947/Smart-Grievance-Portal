import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

router.use(isAuthenticated);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

export default router;
