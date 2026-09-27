import { Router } from 'express';
import {
  getSystemAnalytics,
  getAIInsights,
  getAuditLogs,
  getApprovedRecords,
  addApprovedRecord,
  getUsers,
  toggleUserStatus,
} from '../controllers/adminController.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = Router();

router.use(isAuthenticated, isAdmin);

router.get('/analytics', getSystemAnalytics);
router.get('/ai-insights', getAIInsights);
router.get('/audit-logs', getAuditLogs);
router.get('/approved-records', getApprovedRecords);
router.post('/approved-records', addApprovedRecord);
router.get('/users', getUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);

export default router;
