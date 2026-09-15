import { Router } from 'express';

import { uploadProjectMedia } from '../controllers/project-media.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.js';

const router = Router();

router.post(
  '/projects/:projectId/media',
  requireAuth,
  upload.single('image'),
  uploadProjectMedia,
);

export default router;
