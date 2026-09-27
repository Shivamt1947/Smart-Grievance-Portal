import { Router } from 'express';
import { submitFeedback, getFeedbackForGrievance } from '../controllers/feedbackController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

router.use(isAuthenticated);

router.post('/', submitFeedback);
router.get('/grievance/:grievanceId', getFeedbackForGrievance);

export default router;
