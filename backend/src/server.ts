import express from 'express';

const app = express();
const PORT = 3000;

app.get('/', (_req, res) => {
  res.send('Hello from Project Horizon backend');
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
