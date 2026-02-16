ALTER TABLE users ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE sessions ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE players ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE xp_history ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE weapons ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE weapon_attachments ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE maps ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE player_inventory ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE player_loadouts ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE room_configs ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE game_rooms ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE room_participants ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE matches ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE match_participants ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE match_weapon_usage ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE friendships ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE leaderboards ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE leaderboard_entries ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE achievements ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE achievement_criteria ALTER COLUMN id SET DEFAULT uuidv7();

CREATE EXTENSION IF NOT EXISTS "timescaledb";

SELECT create_hypertable(
  'match_events',
  'time',
  if_not_exists => TRUE,
  migrate_data => TRUE,
  chunk_time_interval => INTERVAL '1 day'
);

SELECT create_hypertable(
  'player_telemetry',
  'time',
  if_not_exists => TRUE,
  migrate_data => TRUE,
  chunk_time_interval => INTERVAL '1 day'
);

SELECT create_hypertable(
  'server_metrics',
  'time',
  if_not_exists => TRUE,
  migrate_data => TRUE,
  chunk_time_interval => INTERVAL '1 day'
);

CREATE TABLE outbox_messages (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  aggregate_type VARCHAR(64) NOT NULL,
  aggregate_id UUID,
  event_type VARCHAR(128) NOT NULL,
  payload JSONB NOT NULL,
  idempotency_key VARCHAR(191) NOT NULL UNIQUE,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT outbox_status_valid CHECK (
    status IN ('pending', 'processing', 'processed', 'failed', 'dead_letter')
  ),
  CONSTRAINT outbox_attempts_non_negative CHECK (attempts >= 0),
  CONSTRAINT outbox_max_attempts_positive CHECK (max_attempts > 0)
);

CREATE INDEX idx_outbox_status_schedule
  ON outbox_messages (status, next_attempt_at, created_at);
CREATE INDEX idx_outbox_event_type
  ON outbox_messages (event_type, created_at DESC);

CREATE TABLE outbox_consumers (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  consumer_name VARCHAR(64) NOT NULL,
  idempotency_key VARCHAR(191) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  CONSTRAINT outbox_consumers_unique_key UNIQUE (consumer_name, idempotency_key)
);

CREATE INDEX idx_outbox_consumers_processed_at
  ON outbox_consumers (processed_at DESC);

CREATE TABLE outbox_dead_letters (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  outbox_message_id UUID NOT NULL REFERENCES outbox_messages (id) ON DELETE CASCADE,
  event_type VARCHAR(128) NOT NULL,
  payload JSONB NOT NULL,
  idempotency_key VARCHAR(191) NOT NULL,
  failure_reason TEXT,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT outbox_dead_letters_unique_message UNIQUE (outbox_message_id)
);

CREATE INDEX idx_outbox_dead_letters_failed_at
  ON outbox_dead_letters (failed_at DESC);
