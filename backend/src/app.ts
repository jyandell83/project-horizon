import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import projectsRouter from './routes/projects.routes.js';
import authRouter from './routes/auth.routes.js';
import sessionsRouter from './routes/sessions.routes.js';

export const app = express();

app.use(
  cors({
    origin: 'http://localhost:4200',
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use('/api/projects', projectsRouter);
app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionsRouter);

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello from the backend' });
});
