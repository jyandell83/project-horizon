import { Router } from 'express';
import {
  signup,
  login,
  logout,
  getCurrentUser,
} from '../controllers/auth.controller.js';

import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, getCurrentUser);

export default router;
