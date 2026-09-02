import { afterAll, describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from './app.js';
import { pool } from './db.js';

describe('GET /api/hello', () => {
  test('returns the backend greeting', async () => {
    const response = await request(app).get('/api/hello').expect(200);

    expect(response.body).toEqual({
      message: 'Hello from the backend',
    });
  });
});

afterAll(async () => {
  await pool.end();
});
