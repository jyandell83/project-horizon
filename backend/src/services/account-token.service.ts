import crypto from 'crypto';
import { pool } from '../db.js';

export type AccountTokenType =
  | 'email_verification'
  | 'password_reset'
  | 'email_change';

interface CreateAccountTokenOptions {
  userId: number;
  type: AccountTokenType;
  expiresInMinutes: number;
  pendingEmail?: string;
}

export async function createAccountToken({
  userId,
  type,
  expiresInMinutes,
  pendingEmail,
}: CreateAccountTokenOptions): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await pool.query(
    `
      UPDATE account_tokens
      SET used_at = NOW()
      WHERE user_id = $1
        AND type = $2
        AND used_at IS NULL
    `,
    [userId, type],
  );

  await pool.query(
    `
      INSERT INTO account_tokens (
        user_id,
        type,
        token_hash,
        pending_email,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [userId, type, tokenHash, pendingEmail ?? null, expiresAt],
  );

  return token;
}

export async function consumeAccountToken(
  token: string,
  type: AccountTokenType,
) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const result = await pool.query(
    `
      UPDATE account_tokens
      SET used_at = NOW()
      WHERE token_hash = $1
        AND type = $2
        AND used_at IS NULL
        AND expires_at > NOW()
      RETURNING
        id,
        user_id,
        type,
        pending_email,
        expires_at,
        used_at
    `,
    [tokenHash, type],
  );

  return result.rows[0] ?? null;
}
