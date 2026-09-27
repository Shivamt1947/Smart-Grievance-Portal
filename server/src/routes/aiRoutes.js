import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  assistDraft,
  summarizeThread,
  studentAssistant,
} from '../controllers/aiController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

router.use(isAuthenticated);

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 AI calls per minute per user
  message: {
    success: false,
    message: 'AI request limit reached. Please wait a moment before trying again.',
  },
});

router.post('/assist-draft', aiLimiter, assistDraft);
router.post('/summarize-grievance', aiLimiter, summarizeThread);
router.post('/chat-assistant', aiLimiter, studentAssistant);

export default router;
