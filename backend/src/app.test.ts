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
  test('rejects duplicate signup', async () => {
    const credentials = {
      email: 'duplicate@example.com',
      password: 'password123',
    };

    await request(app).post('/api/auth/signup').send(credentials).expect(201);

    const response = await request(app)
      .post('/api/auth/signup')
      .send(credentials)
      .expect(409);

    expect(response.body).toEqual({
      message: 'An account with that email already exists',
    });
  });

  test('rejects an incorrect password', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'login-test@example.com',
        password: 'correct-password',
      })
      .expect(201);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login-test@example.com',
        password: 'wrong-password',
      })
      .expect(401);

    expect(response.body).toEqual({
      message: 'Invalid email or password',
    });
  });

  test('protects project and session routes from logged-out users', async () => {
    const projectsResponse = await request(app)
      .get('/api/projects')
      .expect(401);

    expect(projectsResponse.body).toEqual({
      message: 'Authentication required',
    });

    const sessionsResponse = await request(app)
      .get('/api/sessions')
      .expect(401);

    expect(sessionsResponse.body).toEqual({
      message: 'Authentication required',
    });
  });
});

describe('project ownership', () => {
  test('prevents one user from accessing another user’s project', async () => {
    const userA = request.agent(app);
    const userB = request.agent(app);

    await userA
      .post('/api/auth/signup')
      .send({
        email: 'user-a@example.com',
        password: 'password123',
      })
      .expect(201);

    await userB
      .post('/api/auth/signup')
      .send({
        email: 'user-b@example.com',
        password: 'password123',
      })
      .expect(201);

    const createResponse = await userA
      .post('/api/projects')
      .send({
        name: 'User A Project',
        grade: 'V5',
        location: 'Test Gym',
        environment: 'gym',
        status: 'active',
        attempts: 0,
        notes: [],
      })
      .expect(201);

    const projectId = createResponse.body.id;

    const userAProjects = await userA.get('/api/projects').expect(200);

    expect(userAProjects.body).toEqual([
      expect.objectContaining({
        id: projectId,
        name: 'User A Project',
      }),
    ]);

    const userBProjects = await userB.get('/api/projects').expect(200);

    expect(userBProjects.body).toEqual([]);

    await userB.get(`/api/projects/${projectId}`).expect(404);

    await userB
      .patch(`/api/projects/${projectId}/attempts`)
      .send({ change: 5 })
      .expect(404);

    await userB.delete(`/api/projects/${projectId}`).expect(404);

    const unchangedProject = await userA
      .get(`/api/projects/${projectId}`)
      .expect(200);

    expect(unchangedProject.body).toEqual(
      expect.objectContaining({
        id: projectId,
        name: 'User A Project',
        attempts: 0,
      }),
    );
  });
});

afterAll(async () => {
  await resetDatabase();
  await pool.end();
});
