ALTER TABLE sessions ADD COLUMN refresh_token VARCHAR(255);

UPDATE sessions
SET refresh_token = refresh_token_fingerprint
WHERE refresh_token IS NULL;

ALTER TABLE sessions
  ALTER COLUMN refresh_token SET NOT NULL;

DROP INDEX IF EXISTS idx_sessions_token_fingerprint;

CREATE UNIQUE INDEX idx_sessions_token
  ON sessions (refresh_token);

ALTER TABLE sessions
  DROP COLUMN refresh_token_hash,
  DROP COLUMN refresh_token_fingerprint;
