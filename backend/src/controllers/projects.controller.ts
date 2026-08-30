import type { Request, Response } from 'express';
import { pool } from '../db.js';

export async function getProjects(_req: Request, res: Response) {
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
}

export async function createProject(req: Request, res: Response) {
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
}

export async function updateProject(req: Request, res: Response) {
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
}

export async function deleteProject(req: Request, res: Response) {
  const id = Number(req.params.id);

  const result = await pool.query(
    'DELETE FROM projects WHERE id = $1 RETURNING *',
    [id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Project not found' });
  }

  res.status(204).send();
}

export async function updateProjectAttempts(req: Request, res: Response) {
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

  res.json(result.rows[0]);
}

export async function createProjectNote(req: Request, res: Response) {
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
}

export async function deleteProjectNote(req: Request, res: Response) {
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
}

export async function updateProjectNote(req: Request, res: Response) {
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
}

export async function getProjectById(req: Request, res: Response) {
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
}
