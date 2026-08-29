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

app.get('/api/db-test', async (_req, res) => {
  const result = await pool.query('SELECT NOW()');

  res.json(result.rows[0]);
});

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello from the backend' });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
