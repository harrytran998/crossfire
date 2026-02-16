DROP INDEX IF EXISTS idx_outbox_dead_letters_failed_at;
DROP TABLE IF EXISTS outbox_dead_letters;

DROP INDEX IF EXISTS idx_outbox_consumers_processed_at;
DROP TABLE IF EXISTS outbox_consumers;

DROP INDEX IF EXISTS idx_outbox_event_type;
DROP INDEX IF EXISTS idx_outbox_status_schedule;
DROP TABLE IF EXISTS outbox_messages;

DO $$
BEGIN
  BEGIN
    EXECUTE 'SELECT remove_hypertable(''server_metrics'', if_exists => TRUE);';
  EXCEPTION
    WHEN undefined_function THEN NULL;
  END;

  BEGIN
    EXECUTE 'SELECT remove_hypertable(''player_telemetry'', if_exists => TRUE);';
  EXCEPTION
    WHEN undefined_function THEN NULL;
  END;

  BEGIN
    EXECUTE 'SELECT remove_hypertable(''match_events'', if_exists => TRUE);';
  EXCEPTION
    WHEN undefined_function THEN NULL;
  END;
END;
$$;

ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE players ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE xp_history ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE weapons ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE weapon_attachments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE maps ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE player_inventory ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE player_loadouts ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE room_configs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE game_rooms ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE room_participants ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE matches ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE match_participants ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE match_weapon_usage ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE friendships ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE leaderboards ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE leaderboard_entries ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE achievements ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE achievement_criteria ALTER COLUMN id SET DEFAULT gen_random_uuid();
