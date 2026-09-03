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

describe('session lifecycle', () => {
  test('completes and deletes a session while updating project attempts', async () => {
    const agent = request.agent(app);

    await agent
      .post('/api/auth/signup')
      .send({
        email: 'session-test@example.com',
        password: 'password123',
      })
      .expect(201);

    const projectResponse = await agent
      .post('/api/projects')
      .send({
        name: 'Session Project',
        grade: 'V6',
        location: 'Test Gym',
        environment: 'gym',
        status: 'active',
      })
      .expect(201);

    const projectId = projectResponse.body.id;

    const sessionResponse = await agent
      .post('/api/sessions')
      .send({
        location: 'Test Gym',
        environment: 'gym',
      })
      .expect(201);

    const sessionId = sessionResponse.body.id;

    expect(sessionResponse.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        location: 'Test Gym',
        environment: 'gym',
        endedAt: null,
        phases: [],
      }),
    );

    const phaseResponse = await agent
      .post(`/api/sessions/${sessionId}/phases`)
      .send({
        type: 'project',
      })
      .expect(201);

    const phaseId = phaseResponse.body.phase.id;

    await agent
      .post(`/api/sessions/${sessionId}/phases/${phaseId}/projects`)
      .send({
        projectId,
      })
      .expect(201);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await agent
        .patch(
          `/api/sessions/${sessionId}/phases/${phaseId}/projects/${projectId}/attempts`,
        )
        .send({
          change: 1,
        })
        .expect(200);
    }

    const sentResponse = await agent
      .patch(
        `/api/sessions/${sessionId}/phases/${phaseId}/projects/${projectId}/sent`,
      )
      .expect(200);

    expect(sentResponse.body).toEqual(
      expect.objectContaining({
        projectId,
        attempts: 3,
        sent: true,
      }),
    );

    const endResponse = await agent
      .post(`/api/sessions/${sessionId}/end`)
      .expect(200);

    expect(endResponse.body).toEqual(
      expect.objectContaining({
        id: sessionId,
        endedAt: expect.any(String),
      }),
    );

    const savedSessionResponse = await agent
      .get(`/api/sessions/${sessionId}`)
      .expect(200);

    expect(savedSessionResponse.body).toEqual(
      expect.objectContaining({
        id: sessionId,
        location: 'Test Gym',
        endedAt: expect.any(String),
        phases: [
          expect.objectContaining({
            id: phaseId,
            type: 'project',
            endedAt: expect.any(String),
            projectWork: [
              expect.objectContaining({
                projectId,
                attempts: 3,
                sent: true,
              }),
            ],
          }),
        ],
      }),
    );

    const updatedProjectResponse = await agent
      .get(`/api/projects/${projectId}`)
      .expect(200);

    expect(updatedProjectResponse.body).toEqual(
      expect.objectContaining({
        id: projectId,
        attempts: 3,
        status: 'sent',
      }),
    );

    await agent.delete(`/api/sessions/${sessionId}`).expect(204);

    await agent.get(`/api/sessions/${sessionId}`).expect(404);

    const restoredProjectResponse = await agent
      .get(`/api/projects/${projectId}`)
      .expect(200);

    expect(restoredProjectResponse.body).toEqual(
      expect.objectContaining({
        id: projectId,
        attempts: 0,
        status: 'sent',
      }),
    );
  });
});

describe('session ownership', () => {
  test('prevents one user from accessing or modifying another user’s session', async () => {
    const userA = request.agent(app);
    const userB = request.agent(app);

    await userA
      .post('/api/auth/signup')
      .send({
        email: 'session-owner@example.com',
        password: 'password123',
      })
      .expect(201);

    await userB
      .post('/api/auth/signup')
      .send({
        email: 'other-user@example.com',
        password: 'password123',
      })
      .expect(201);

    const projectResponse = await userA
      .post('/api/projects')
      .send({
        name: 'Private Project',
        grade: 'V7',
        location: 'Private Gym',
        environment: 'gym',
        status: 'active',
      })
      .expect(201);

    const projectId = projectResponse.body.id;

    const sessionResponse = await userA
      .post('/api/sessions')
      .send({
        location: 'Private Gym',
        environment: 'gym',
      })
      .expect(201);

    const sessionId = sessionResponse.body.id;

    const phaseResponse = await userA
      .post(`/api/sessions/${sessionId}/phases`)
      .send({
        type: 'project',
      })
      .expect(201);

    const phaseId = phaseResponse.body.phase.id;

    await userA
      .post(`/api/sessions/${sessionId}/phases/${phaseId}/projects`)
      .send({
        projectId,
      })
      .expect(201);

    await userB.get(`/api/sessions/${sessionId}`).expect(404);

    await userB
      .post(`/api/sessions/${sessionId}/phases`)
      .send({
        type: 'warm-up',
      })
      .expect(404);

    await userB
      .patch(
        `/api/sessions/${sessionId}/phases/${phaseId}/projects/${projectId}/attempts`,
      )
      .send({
        change: 1,
      })
      .expect(404);

    await userB
      .patch(
        `/api/sessions/${sessionId}/phases/${phaseId}/projects/${projectId}/sent`,
      )
      .expect(404);

    await userB
      .patch(`/api/sessions/${sessionId}/phases/${phaseId}/end`)
      .expect(404);

    await userB.post(`/api/sessions/${sessionId}/end`).expect(404);

    const userBSessions = await userB.get('/api/sessions').expect(200);

    expect(userBSessions.body).toEqual([]);

    const unchangedSession = await userA
      .get(`/api/sessions/${sessionId}`)
      .expect(200);

    expect(unchangedSession.body.phases[0].projectWork[0]).toEqual(
      expect.objectContaining({
        projectId,
        attempts: 0,
        sent: false,
      }),
    );

    await userA.post(`/api/sessions/${sessionId}/end`).expect(200);

    await userB.delete(`/api/sessions/${sessionId}`).expect(404);

    await userA.get(`/api/sessions/${sessionId}`).expect(200);
  });
});

afterAll(async () => {
  await resetDatabase();
  await pool.end();
});
