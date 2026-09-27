import { Router } from 'express';
import {
  createGrievance,
  getGrievances,
  getGrievanceById,
  updateGrievanceStatus,
  assignTeacher,
  reopenGrievance,
  closeGrievance,
  deleteGrievance,
  checkDuplicates,
} from '../controllers/grievanceController.js';
import { isAuthenticated, isAdmin, canAccessGrievance } from '../middleware/auth.js';
import { upload } from '../utils/fileUpload.js';

const router = Router();

router.use(isAuthenticated);

router.post('/check-duplicates', checkDuplicates);
router.get('/', getGrievances);
router.post('/', upload.array('attachments', 4), createGrievance);
router.get('/:id', canAccessGrievance, getGrievanceById);
router.patch('/:id/status', canAccessGrievance, updateGrievanceStatus);
router.patch('/:id/assign', isAdmin, assignTeacher);
router.post('/:id/reopen', canAccessGrievance, reopenGrievance);
router.post('/:id/close', canAccessGrievance, closeGrievance);
router.delete('/:id', canAccessGrievance, deleteGrievance);

export default router;
