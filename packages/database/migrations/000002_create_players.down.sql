-- Drop players tables
DROP INDEX IF EXISTS idx_stats_wins;
DROP INDEX IF EXISTS idx_stats_kills;
DROP INDEX IF EXISTS idx_players_region;
DROP INDEX IF EXISTS idx_players_name;
DROP INDEX IF EXISTS idx_players_user;

DROP TABLE IF EXISTS player_stats;
DROP TABLE IF EXISTS players;
