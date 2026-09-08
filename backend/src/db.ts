import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      database: process.env.DB_NAME ?? 'project_horizon',
    });
