import { Router } from 'express';

import { requireAuth } from '../middleware/auth.middleware.js';

import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateProjectAttempts,
  createProjectNote,
  updateProjectNote,
  deleteProjectNote,
} from '../controllers/projects.controller.js';

import upload from '../middleware/upload.js';
import { uploadProjectMedia } from '../controllers/project-media.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', getProjects);
router.get('/:id', getProjectById);

router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/media', upload.single('image'), uploadProjectMedia);

router.patch('/:id/attempts', updateProjectAttempts);

router.post('/:id/notes', createProjectNote);
router.patch('/:projectId/notes/:noteId', updateProjectNote);
router.delete('/:projectId/notes/:noteId', deleteProjectNote);

export default router;
