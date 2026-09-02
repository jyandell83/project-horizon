import { Pool } from 'pg';

export const pool = new Pool({
  database: process.env.DB_NAME ?? 'project_horizon',
});
