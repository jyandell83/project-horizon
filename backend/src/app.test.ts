import {
  afterAll,
  beforeEach,
  describe,
  expect,
  test,
  jest,
} from '@jest/globals';
import request from 'supertest';

import cloudinary from './config/cloudinary.js';

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
  jest.restoreAllMocks();
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

describe('project media', () => {
  test('allows a user to upload media to their own project', async () => {
    const agent = request.agent(app);

    await agent
      .post('/api/auth/signup')
      .send({
        email: 'media-owner@example.com',
        password: 'password123',
      })
      .expect(201);

    const projectResponse = await agent
      .post('/api/projects')
      .send({
        name: 'Media Project',
        grade: 'V5',
        location: 'Test Gym',
        environment: 'gym',
        status: 'active',
      })
      .expect(201);

    const projectId = projectResponse.body.id;

    const uploadStreamSpy = jest.spyOn(
      cloudinary.uploader,
      'upload_stream',
    ) as jest.MockedFunction<any>;

    uploadStreamSpy.mockImplementation((_options: any, callback: any) => {
      return {
        end: () => {
          callback(null, {
            public_id: 'project-horizon/projects/test-image',
            secure_url: 'https://example.com/test-image.jpg',
          });
        },
      };
    });

    const response = await agent
      .post(`/api/projects/${projectId}/media`)
      .attach('image', Buffer.from('fake image data'), {
        filename: 'test.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        project_id: projectId,
        media_type: 'image',
        cloudinary_public_id: 'project-horizon/projects/test-image',
        url: 'https://example.com/test-image.jpg',
      }),
    );

    const mediaResult = await pool.query(
      `
        SELECT *
        FROM project_media
        WHERE project_id = $1
      `,
      [projectId],
    );

    expect(mediaResult.rows).toHaveLength(1);
  });

  test('prevents one user from uploading media to another user’s project', async () => {
    const userA = request.agent(app);
    const userB = request.agent(app);

    await userA
      .post('/api/auth/signup')
      .send({
        email: 'media-user-a@example.com',
        password: 'password123',
      })
      .expect(201);

    await userB
      .post('/api/auth/signup')
      .send({
        email: 'media-user-b@example.com',
        password: 'password123',
      })
      .expect(201);

    const projectResponse = await userA
      .post('/api/projects')
      .send({
        name: 'Private Media Project',
        grade: 'V6',
        location: 'Test Gym',
        environment: 'gym',
        status: 'active',
      })
      .expect(201);

    const projectId = projectResponse.body.id;

    const uploadSpy = jest.spyOn(cloudinary.uploader, 'upload_stream');

    await userB
      .post(`/api/projects/${projectId}/media`)
      .attach('image', Buffer.from('fake image data'), {
        filename: 'test.jpg',
        contentType: 'image/jpeg',
      })
      .expect(404);

    expect(uploadSpy).not.toHaveBeenCalled();

    const mediaResult = await pool.query(
      `
        SELECT *
        FROM project_media
        WHERE project_id = $1
      `,
      [projectId],
    );

    expect(mediaResult.rows).toHaveLength(0);
  });

  test('allows a user to delete media from their own project', async () => {
    const agent = request.agent(app);

    await agent
      .post('/api/auth/signup')
      .send({
        email: 'media-delete@example.com',
        password: 'password123',
      })
      .expect(201);

    const projectResponse = await agent
      .post('/api/projects')
      .send({
        name: 'Delete Media Project',
        grade: 'V4',
        location: 'Test Gym',
        environment: 'gym',
        status: 'active',
      })
      .expect(201);

    const projectId = projectResponse.body.id;

    const mediaResult = await pool.query(
      `
        INSERT INTO project_media (
          project_id,
          media_type,
          cloudinary_public_id,
          url
        )
        VALUES ($1, 'image', $2, $3)
        RETURNING *
      `,
      [
        projectId,
        'project-horizon/projects/delete-test',
        'https://example.com/delete-test.jpg',
      ],
    );

    const mediaId = mediaResult.rows[0].id;

    const destroySpy = jest
      .spyOn(cloudinary.uploader, 'destroy')
      .mockResolvedValue({
        result: 'ok',
      } as any);

    await agent
      .delete(`/api/projects/${projectId}/media/${mediaId}`)
      .expect(204);

    expect(destroySpy).toHaveBeenCalledWith(
      'project-horizon/projects/delete-test',
      {
        resource_type: 'image',
        invalidate: true,
      },
    );

    const deletedMedia = await pool.query(
      `
        SELECT *
        FROM project_media
        WHERE id = $1
      `,
      [mediaId],
    );

    expect(deletedMedia.rows).toHaveLength(0);
  });

  test('prevents one user from deleting another user’s media', async () => {
    const userA = request.agent(app);
    const userB = request.agent(app);

    await userA
      .post('/api/auth/signup')
      .send({
        email: 'media-owner-a@example.com',
        password: 'password123',
      })
      .expect(201);

    await userB
      .post('/api/auth/signup')
      .send({
        email: 'media-owner-b@example.com',
        password: 'password123',
      })
      .expect(201);

    const projectResponse = await userA
      .post('/api/projects')
      .send({
        name: 'Protected Media Project',
        grade: 'V7',
        location: 'Test Gym',
        environment: 'gym',
        status: 'active',
      })
      .expect(201);

    const projectId = projectResponse.body.id;

    const mediaResult = await pool.query(
      `
        INSERT INTO project_media (
          project_id,
          media_type,
          cloudinary_public_id,
          url
        )
        VALUES ($1, 'image', $2, $3)
        RETURNING *
      `,
      [
        projectId,
        'project-horizon/projects/protected-test',
        'https://example.com/protected-test.jpg',
      ],
    );

    const mediaId = mediaResult.rows[0].id;

    const destroySpy = jest.spyOn(cloudinary.uploader, 'destroy');

    await userB
      .delete(`/api/projects/${projectId}/media/${mediaId}`)
      .expect(404);

    expect(destroySpy).not.toHaveBeenCalled();

    const unchangedMedia = await pool.query(
      `
        SELECT *
        FROM project_media
        WHERE id = $1
      `,
      [mediaId],
    );

    expect(unchangedMedia.rows).toHaveLength(1);
  });

  test('keeps the database row if Cloudinary deletion fails', async () => {
    const agent = request.agent(app);

    await agent
      .post('/api/auth/signup')
      .send({
        email: 'media-failure@example.com',
        password: 'password123',
      })
      .expect(201);

    const projectResponse = await agent
      .post('/api/projects')
      .send({
        name: 'Cloudinary Failure Project',
        grade: 'V3',
        location: 'Test Gym',
        environment: 'gym',
        status: 'active',
      })
      .expect(201);

    const projectId = projectResponse.body.id;

    const mediaResult = await pool.query(
      `
        INSERT INTO project_media (
          project_id,
          media_type,
          cloudinary_public_id,
          url
        )
        VALUES ($1, 'image', $2, $3)
        RETURNING *
      `,
      [
        projectId,
        'project-horizon/projects/failure-test',
        'https://example.com/failure-test.jpg',
      ],
    );

    const mediaId = mediaResult.rows[0].id;

    jest.spyOn(cloudinary.uploader, 'destroy').mockResolvedValue({
      result: 'not found',
    } as any);

    await agent
      .delete(`/api/projects/${projectId}/media/${mediaId}`)
      .expect(500);

    const unchangedMedia = await pool.query(
      `
        SELECT *
        FROM project_media
        WHERE id = $1
      `,
      [mediaId],
    );

    expect(unchangedMedia.rows).toHaveLength(1);
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
