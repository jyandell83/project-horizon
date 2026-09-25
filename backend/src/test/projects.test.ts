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

describe('project ownership', () => {
  test('prevents one user from accessing another user’s project', async () => {
    const { agent: userA } = await createTestUser('user-a@example.com');
    const { agent: userB } = await createTestUser('user-b@example.com');

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
  await pool.end();
});
