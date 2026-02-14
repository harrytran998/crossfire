-- Drop progression tables
DROP INDEX IF EXISTS idx_xp_history_player;
DROP INDEX IF EXISTS idx_progression_level;

DROP TABLE IF EXISTS xp_history;
DROP TABLE IF EXISTS player_progression;
DELETE FROM levels WHERE level <= 100;
DROP TABLE IF EXISTS levels;
