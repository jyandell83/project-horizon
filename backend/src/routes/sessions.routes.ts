import { Router } from 'express';

import {
  createSession,
  createSessionPhase,
  getSessions,
  addProjectToSessionPhase,
  updateSessionProjectAttempts,
  markSessionProjectSent,
  endSessionPhase,
  endSession,
  deleteSession,
  updateSession,
  getSessionById,
} from '../controllers/sessions.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getSessions);
router.post('/', createSession);
router.post('/:sessionId/phases', createSessionPhase);
router.post('/:sessionId/phases/:phaseId/projects', addProjectToSessionPhase);
router.patch(
  '/:sessionId/phases/:phaseId/projects/:projectId/attempts',
  updateSessionProjectAttempts,
);
router.patch(
  '/:sessionId/phases/:phaseId/projects/:projectId/sent',
  markSessionProjectSent,
);
router.patch('/:sessionId/phases/:phaseId/end', endSessionPhase);
router.post('/:sessionId/end', endSession);
router.delete('/:sessionId', deleteSession);
router.patch('/:sessionId', updateSession);
router.get('/:sessionId', getSessionById);

export default router;
