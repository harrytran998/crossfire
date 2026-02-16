CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE sessions
  ADD COLUMN refresh_token_hash VARCHAR(255),
  ADD COLUMN refresh_token_fingerprint CHAR(64);

UPDATE sessions
SET
  refresh_token_hash = crypt(refresh_token, gen_salt('bf', 12)),
  refresh_token_fingerprint = encode(digest(refresh_token, 'sha256'), 'hex')
WHERE refresh_token_hash IS NULL OR refresh_token_fingerprint IS NULL;

ALTER TABLE sessions
  ALTER COLUMN refresh_token_hash SET NOT NULL,
  ALTER COLUMN refresh_token_fingerprint SET NOT NULL;

DROP INDEX IF EXISTS idx_sessions_token;

CREATE UNIQUE INDEX idx_sessions_token_fingerprint
  ON sessions (refresh_token_fingerprint);

ALTER TABLE sessions DROP COLUMN refresh_token;
