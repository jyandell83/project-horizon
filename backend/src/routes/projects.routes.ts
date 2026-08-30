import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const projectsResult = await pool.query('SELECT * FROM projects ORDER BY id');

  const notesResult = await pool.query(
    'SELECT * FROM project_notes ORDER BY created_at',
  );

  const projects = projectsResult.rows.map((project) => ({
    ...project,
    notes: notesResult.rows
      .filter((note) => note.project_id === project.id)
      .map((note) => ({
        id: note.id,
        body: note.body,
        date: note.created_at,
      })),
  }));

  res.json(projects);
});

router.post('/', async (req, res) => {
  // create project
  const { name, grade, location, environment } = req.body;

  const result = await pool.query(
    `INSERT INTO projects (name, grade, location, environment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, grade, location, environment],
  );

  const newProject = {
    ...result.rows[0],
    notes: [],
  };

  res.status(201).json(newProject);
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, grade, location, environment, status } = req.body;

  const result = await pool.query(
    `
    UPDATE projects
    SET
      name = $1,
      grade = $2,
      location = $3,
      environment = $4,
      status = $5
    WHERE id = $6
    RETURNING *
    `,
    [name, grade, location, environment, status, id],
  );

  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  // delete project
  const id = Number(req.params.id);

  const result = await pool.query(
    'DELETE FROM projects WHERE id = $1 RETURNING *',
    [id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Project not found' });
  }

  res.status(204).send();
});

router.patch('/:id/attempts', async (req, res) => {
  // update attempts
  const id = Number(req.params.id);
  const { change } = req.body;

  const result = await pool.query(
    `
    UPDATE projects
    SET attempts = GREATEST(0, attempts + $1)
    WHERE id = $2
    RETURNING *
    `,
    [change, id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const updatedProject = {
    ...result.rows[0],
    notes: [],
  };

  res.json(updatedProject);
});

router.post('/:id/notes', async (req, res) => {
  //create note
  const projectId = Number(req.params.id);
  const { body } = req.body;

  const result = await pool.query(
    `
    INSERT INTO project_notes (project_id, body)
    VALUES ($1, $2)
    RETURNING *
    `,
    [projectId, body],
  );

  const note = result.rows[0];

  res.status(201).json({
    id: note.id,
    body: note.body,
    date: note.created_at,
  });
});

router.delete('/:projectId/notes/:noteId', async (req, res) => {
  //delete note
  const projectId = Number(req.params.projectId);
  const noteId = Number(req.params.noteId);

  const result = await pool.query(
    `
    DELETE FROM project_notes
    WHERE id = $1 AND project_id = $2
    RETURNING *
    `,
    [noteId, projectId],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Note not found' });
  }

  res.status(204).send();
});

router.patch('/:projectId/notes/:noteId', async (req, res) => {
  //update note
  const projectId = Number(req.params.projectId);
  const noteId = Number(req.params.noteId);
  const { body } = req.body;

  const result = await pool.query(
    `
      UPDATE project_notes
      SET body = $1
      WHERE id = $2 AND project_id = $3
      RETURNING *
      `,
    [body, noteId, projectId],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Note not found' });
  }

  const note = result.rows[0];

  res.json({
    id: note.id,
    body: note.body,
    date: note.created_at,
  });
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  const projectResult = await pool.query(
    'SELECT * FROM projects WHERE id = $1',
    [id],
  );

  if (projectResult.rows.length === 0) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const notesResult = await pool.query(
    `
    SELECT *
    FROM project_notes
    WHERE project_id = $1
    ORDER BY created_at
    `,
    [id],
  );

  const project = {
    ...projectResult.rows[0],
    notes: notesResult.rows.map((note) => ({
      id: note.id,
      body: note.body,
      date: note.created_at,
    })),
  };

  res.json(project);
});

export default router;
