import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
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
