import { Router } from 'express';
import { getMessagesByGrievance, postMessage } from '../controllers/messageController.js';
import { isAuthenticated } from '../middleware/auth.js';
import { upload } from '../utils/fileUpload.js';

const router = Router();

router.use(isAuthenticated);

router.get('/grievance/:grievanceId', getMessagesByGrievance);
router.post('/grievance/:grievanceId', upload.array('attachments', 2), postMessage);

export default router;
