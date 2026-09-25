import {
  beforeEach,
  afterAll,
  describe,
  expect,
  test,
  jest,
} from '@jest/globals';
import request from 'supertest';
import { pool } from '../db.js';
import crypto from 'crypto';

import { resetDatabase } from './helpers/database.js';

jest.unstable_mockModule('../services/email.service.js', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

import { app } from '../app.js';

beforeEach(async () => {
  jest.restoreAllMocks();
  await resetDatabase();
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
        email_verified_at: null,
      }),
    );

    const currentUserResponse = await agent.get('/api/auth/me').expect(200);

    expect(currentUserResponse.body).toEqual(
      expect.objectContaining({
        id: signupResponse.body.id,
        email: 'auth-test@example.com',
        email_verified_at: null,
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

describe('email verification', () => {
  test('creates an email verification token when a user signs up', async () => {
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'verify-signup@example.com',
        password: 'password123',
      })
      .expect(201);

    const tokenResult = await pool.query(
      `
        SELECT user_id, type, token_hash, expires_at, used_at
        FROM account_tokens
        WHERE user_id = $1
          AND type = 'email_verification'
      `,
      [signupResponse.body.id],
    );

    expect(tokenResult.rows).toHaveLength(1);

    expect(tokenResult.rows[0]).toEqual(
      expect.objectContaining({
        user_id: signupResponse.body.id,
        type: 'email_verification',
        token_hash: expect.any(String),
        used_at: null,
      }),
    );
  });

  test('verifies an email with a valid token', async () => {
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'verify-success@example.com',
        password: 'password123',
      })
      .expect(201);

    const rawToken = 'known-verification-token';

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await pool.query(
      `
        INSERT INTO account_tokens (
          user_id,
          type,
          token_hash,
          expires_at
        )
        VALUES ($1, 'email_verification', $2, NOW() + INTERVAL '1 hour')
      `,
      [signupResponse.body.id, tokenHash],
    );

    const response = await request(app)
      .post('/api/auth/verify-email')
      .send({
        token: rawToken,
      })
      .expect(200);

    expect(response.body).toEqual({
      message: 'Email verified successfully',
    });

    const userResult = await pool.query(
      `
        SELECT email_verified_at
        FROM users
        WHERE id = $1
      `,
      [signupResponse.body.id],
    );

    expect(userResult.rows[0].email_verified_at).not.toBeNull();
  });

  test('does not allow a verification token to be reused', async () => {
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'verify-reuse@example.com',
        password: 'password123',
      })
      .expect(201);

    const rawToken = 'single-use-verification-token';

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await pool.query(
      `
        INSERT INTO account_tokens (
          user_id,
          type,
          token_hash,
          expires_at
        )
        VALUES ($1, 'email_verification', $2, NOW() + INTERVAL '1 hour')
      `,
      [signupResponse.body.id, tokenHash],
    );

    await request(app)
      .post('/api/auth/verify-email')
      .send({
        token: rawToken,
      })
      .expect(200);

    const response = await request(app)
      .post('/api/auth/verify-email')
      .send({
        token: rawToken,
      })
      .expect(400);

    expect(response.body).toEqual({
      message: 'Verification link is invalid or expired',
    });
  });

  test('rejects an expired verification token', async () => {
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'verify-expired@example.com',
        password: 'password123',
      })
      .expect(201);

    const rawToken = 'expired-verification-token';

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await pool.query(
      `
        INSERT INTO account_tokens (
          user_id,
          type,
          token_hash,
          expires_at
        )
        VALUES ($1, 'email_verification', $2, NOW() - INTERVAL '1 hour')
      `,
      [signupResponse.body.id, tokenHash],
    );

    await request(app)
      .post('/api/auth/verify-email')
      .send({
        token: rawToken,
      })
      .expect(400);
  });
});

describe('password reset', () => {
  test('returns the same response for existing and nonexistent emails', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'reset-existing@example.com',
        password: 'password123',
      })
      .expect(201);

    const existingResponse = await request(app)
      .post('/api/auth/forgot-password')
      .send({
        email: 'reset-existing@example.com',
      })
      .expect(200);

    const missingResponse = await request(app)
      .post('/api/auth/forgot-password')
      .send({
        email: 'does-not-exist@example.com',
      })
      .expect(200);

    expect(existingResponse.body).toEqual(missingResponse.body);

    expect(existingResponse.body).toEqual({
      message:
        'If an account exists for that email, we sent a password reset link.',
    });
  });

  test('resets the password with a valid token', async () => {
    const oldPassword = 'old-password123';
    const newPassword = 'new-password123';

    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'reset-success@example.com',
        password: oldPassword,
      })
      .expect(201);

    const rawToken = 'known-password-reset-token';

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await pool.query(
      `
        INSERT INTO account_tokens (
          user_id,
          type,
          token_hash,
          expires_at
        )
        VALUES ($1, 'password_reset', $2, NOW() + INTERVAL '1 hour')
      `,
      [signupResponse.body.id, tokenHash],
    );

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: rawToken,
        password: newPassword,
      })
      .expect(200);

    expect(response.body).toEqual({
      message: 'Password reset successfully',
    });

    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'reset-success@example.com',
        password: oldPassword,
      })
      .expect(401);

    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'reset-success@example.com',
        password: newPassword,
      })
      .expect(200);
  });

  test('does not allow a password reset token to be reused', async () => {
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'reset-reuse@example.com',
        password: 'password123',
      })
      .expect(201);

    const rawToken = 'single-use-reset-token';

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await pool.query(
      `
        INSERT INTO account_tokens (
          user_id,
          type,
          token_hash,
          expires_at
        )
        VALUES ($1, 'password_reset', $2, NOW() + INTERVAL '1 hour')
      `,
      [signupResponse.body.id, tokenHash],
    );

    await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: rawToken,
        password: 'new-password123',
      })
      .expect(200);

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: rawToken,
        password: 'another-password123',
      })
      .expect(400);

    expect(response.body).toEqual({
      message: 'Password reset link is invalid or expired',
    });
  });

  test('rejects an expired password reset token', async () => {
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'reset-expired@example.com',
        password: 'password123',
      })
      .expect(201);

    const rawToken = 'expired-password-reset-token';

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await pool.query(
      `
        INSERT INTO account_tokens (
          user_id,
          type,
          token_hash,
          expires_at
        )
        VALUES ($1, 'password_reset', $2, NOW() - INTERVAL '1 hour')
      `,
      [signupResponse.body.id, tokenHash],
    );

    await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: rawToken,
        password: 'new-password123',
      })
      .expect(400);
  });
});

afterAll(async () => {
  await pool.end();
});
