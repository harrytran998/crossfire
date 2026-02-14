DROP INDEX IF EXISTS idx_server_metrics_time;
DROP INDEX IF EXISTS idx_telemetry_match;
DROP INDEX IF EXISTS idx_telemetry_player;
DROP INDEX IF EXISTS idx_match_events_player;
DROP INDEX IF EXISTS idx_match_events_type;
DROP INDEX IF EXISTS idx_match_events_match;

DROP TABLE IF EXISTS server_metrics;
DROP TABLE IF EXISTS player_telemetry;
DROP TABLE IF EXISTS match_events;
