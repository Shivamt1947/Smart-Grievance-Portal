import { Router } from 'express';
import {
  getWorkers,
  getWorkerById,
  createWorker,
  updateWorker,
  deleteWorker,
} from '../controllers/workerController.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = Router();

router.use(isAuthenticated);

router.get('/', getWorkers);
router.get('/:id', getWorkerById);
router.post('/', isAdmin, createWorker);
router.patch('/:id', isAdmin, updateWorker);
router.delete('/:id', isAdmin, deleteWorker);

export default router;
