import { Router } from 'express';
import {
  getCommonIssues,
  createCommonIssue,
  updateCommonIssueStatus,
} from '../controllers/commonIssueController.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = Router();

router.use(isAuthenticated);

router.get('/', getCommonIssues);
router.post('/', isAdmin, createCommonIssue);
router.patch('/:id/status', isAdmin, updateCommonIssueStatus);

export default router;
