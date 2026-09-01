import { Router } from 'express';
import { signup, login } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);

router.get('/me', requireAuth, (req: any, res) => {
  return res.json({
    userId: req.userId,
  });
});

export default router;
