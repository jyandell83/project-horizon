import {
  beforeEach,
  afterAll,
  describe,
  expect,
  test,
  jest,
} from '@jest/globals';

import { pool } from '../db.js';

import { resetDatabase } from './helpers/database.js';
import { createTestUser } from './helpers/auth.js';

beforeEach(async () => {
  jest.restoreAllMocks();
  await resetDatabase();
});

describe('session lifecycle', () => {
  test('completes and deletes a session while updating project attempts', async () => {
    const { agent } = await createTestUser('session-test@example.com');

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
    const { agent: userA } = await createTestUser('session-owner@example.com');

    const { agent: userB } = await createTestUser('other-user@example.com');

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
  await pool.end();
});
