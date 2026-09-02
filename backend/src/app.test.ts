import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from './app.js';
import { pool } from './db.js';

async function resetDatabase() {
  await pool.query(`
    TRUNCATE TABLE
      session_project_work,
      session_phases,
      sessions,
      project_notes,
      projects,
      users
    RESTART IDENTITY CASCADE
  `);
}

beforeEach(async () => {
  await resetDatabase();
});

describe('GET /api/hello', () => {
  test('returns the backend greeting', async () => {
    const response = await request(app).get('/api/hello').expect(200);

    expect(response.body).toEqual({
      message: 'Hello from the backend',
    });
  });
});

describe('authentication lifecycle', () => {
  test('signs up, restores the user, and logs out', async () => {
    const agent = request.agent(app);

    const signupResponse = await agent
      .post('/api/auth/signup')
      .send({
        email: 'auth-test@example.com',
        password: 'password123',
      })
      .expect(201);

    expect(signupResponse.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        email: 'auth-test@example.com',
      }),
    );

    const currentUserResponse = await agent.get('/api/auth/me').expect(200);

    expect(currentUserResponse.body).toEqual(
      expect.objectContaining({
        id: signupResponse.body.id,
        email: 'auth-test@example.com',
      }),
    );

    await agent.post('/api/auth/logout').expect(204);

    const loggedOutResponse = await agent.get('/api/auth/me').expect(401);

    expect(loggedOutResponse.body).toEqual({
      message: 'Authentication required',
    });
  });
});

afterAll(async () => {
  await resetDatabase();
  await pool.end();
});
