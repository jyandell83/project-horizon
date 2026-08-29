import { Pool } from 'pg';

export const pool = new Pool({
  database: 'project_horizon',
});
