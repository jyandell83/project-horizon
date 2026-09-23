BEGIN;

ALTER TABLE users
ADD COLUMN email_verified_at TIMESTAMPTZ;

CREATE TABLE account_tokens (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL
    CHECK (
      type IN (
        'email_verification',
        'password_reset',
        'email_change'
      )
    ),
  token_hash TEXT NOT NULL,
  pending_email VARCHAR(255),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_account_tokens_token_hash
ON account_tokens(token_hash);

CREATE INDEX idx_account_tokens_user_type
ON account_tokens(user_id, type);

COMMIT;