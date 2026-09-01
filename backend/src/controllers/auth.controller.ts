import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

export async function signup(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
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

    return res.status(201).json(result.rows[0]);
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

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    });

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
