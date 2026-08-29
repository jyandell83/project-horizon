import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: 'http://localhost:4200',
  }),
);

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello from the backend' });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
