import type { CookieOptions, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const authCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 1000,
};

function setAuthCookie(res: Response, userId: number) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: '1h',
  });

  res.cookie('token', token, authCookieOptions);
}

export async function signup(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
        INSERT INTO users (email, password_hash)
        VALUES ($1, $2)
        RETURNING id, email, created_at
      `,
      [email, passwordHash],
    );

    const user = result.rows[0];

    setAuthCookie(res, user.id);

    return res.status(201).json(user);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'An account with that email already exists',
      });
    }

    console.error('Error creating user:', error);

    return res.status(500).json({
      message: 'Failed to create user',
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const result = await pool.query(
      `
        SELECT id, email, password_hash
        FROM users
        WHERE email = $1
      `,
      [email],
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    setAuthCookie(res, user.id);

    return res.status(200).json({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Error logging in:', error);

    return res.status(500).json({
      message: 'Failed to log in',
    });
  }
}

export function logout(_req: Request, res: Response) {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return res.status(204).send();
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    const result = await pool.query(
      `
        SELECT id, email, created_at
        FROM users
        WHERE id = $1
      `,
      [userId],
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error getting current user:', error);

    return res.status(500).json({
      message: 'Failed to get current user',
    });
  }
}
