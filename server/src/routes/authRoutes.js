import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', isAuthenticated, getMe);

export default router;
