import {
  beforeEach,
  afterAll,
  describe,
  expect,
  test,
  jest,
} from '@jest/globals';

import { pool } from '../db.js';
import cloudinary from '../config/cloudinary.js';

import { resetDatabase } from './helpers/database.js';
import { createTestUser } from './helpers/auth.js';

beforeEach(async () => {
  jest.restoreAllMocks();
  await resetDatabase();
});

describe('project media', () => {
  test('allows a user to upload media to their own project', async () => {
    const { agent } = await createTestUser('media-owner@example.com');

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
    const { agent: userA } = await createTestUser('media-user-a@example.com');

    const { agent: userB } = await createTestUser('media-user-b@example.com');

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
    const { agent } = await createTestUser('media-delete@example.com');

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
    const { agent: userA } = await createTestUser('media-owner-a@example.com');

    const { agent: userB } = await createTestUser('media-owner-b@example.com');

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
    const { agent } = await createTestUser('media-failure@example.com');

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

    jest
      .spyOn(cloudinary.uploader, 'destroy')
      .mockRejectedValueOnce(new Error('Cloudinary delete failed'));

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

afterAll(async () => {
  await pool.end();
});
