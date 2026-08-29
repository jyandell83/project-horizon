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
  const result = await pool.query('SELECT * FROM projects');

  res.json(result.rows);
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

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello from the backend' });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
