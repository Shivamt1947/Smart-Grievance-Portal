import { Router } from 'express';
import {
  forwardToTechnical,
  assignWorker,
  startTechnicalWork,
  addProgressUpdate,
  submitWorkReport,
  verifyTechnicalWork,
  confirmTechnicalResolution,
  getTechnicalGrievances,
  getWorkerDashboard,
  getTechnicalStats,
} from '../controllers/technicalController.js';
import { isAuthenticated, isTeacherOrAdmin } from '../middleware/auth.js';
import { upload } from '../utils/fileUpload.js';

const router = Router();
router.use(isAuthenticated);

// List / Dashboard / Stats
router.get('/', getTechnicalGrievances);
router.get('/stats', getTechnicalStats);
router.get('/worker-dashboard', getWorkerDashboard);

// Teacher / Admin actions
router.post('/:id/forward-technical', isTeacherOrAdmin, forwardToTechnical);
router.post('/:id/assign-worker', isTeacherOrAdmin, assignWorker);
router.patch('/:id/verify-technical', isTeacherOrAdmin, verifyTechnicalWork);

// Worker actions
router.patch('/:id/start-work', startTechnicalWork);
router.post('/:id/technical-progress', addProgressUpdate);
router.post('/:id/work-report', upload.array('evidence', 5), submitWorkReport);

// Student action
router.post('/:id/confirm-resolution', confirmTechnicalResolution);

export default router;
