import { Router } from 'express';
import {
  signup,
  login,
  logout,
  getCurrentUser,
  verifyEmail,
  resendVerificationEmail,
} from '../controllers/auth.controller.js';

import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, getCurrentUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', requireAuth, resendVerificationEmail);

export default router;
