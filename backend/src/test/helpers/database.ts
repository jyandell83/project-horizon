import { pool } from '../../db.js';

export async function resetDatabase() {
  await pool.query(`
    TRUNCATE TABLE
      account_tokens,
      project_media,
      session_project_work,
      session_phases,
      sessions,
      project_notes,
      projects,
      users
    RESTART IDENTITY CASCADE
  `);
}
