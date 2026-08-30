import express from 'express';
import cors from 'cors';

import { pool } from './db.js';

const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: 'http://localhost:4200',
  }),
);

app.use(express.json());

app.get('/api/projects', async (_req, res) => {
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

app.post('/api/projects', async (req, res) => {
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

app.put('/api/projects/:id', async (req, res) => {
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

  const updatedProject = {
    ...result.rows[0],
    notes: [],
  };

  res.json(updatedProject);
});

app.patch('/api/projects/:id/attempts', async (req, res) => {
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

app.delete('/api/projects/:id', async (req, res) => {
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

app.post('/api/projects/:id/notes', async (req, res) => {
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

app.delete('/api/projects/:projectId/notes/:noteId', async (req, res) => {
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

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello from the backend' });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
