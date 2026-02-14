DROP INDEX IF EXISTS idx_participants_player;
DROP INDEX IF EXISTS idx_participants_room;
DROP INDEX IF EXISTS idx_rooms_host;
DROP INDEX IF EXISTS idx_rooms_code;
DROP INDEX IF EXISTS idx_rooms_status;

DROP TABLE IF EXISTS room_participants;
DROP TABLE IF EXISTS game_rooms;
DELETE FROM room_configs WHERE name IN ('TDM Standard', 'TDM Quick', 'FFA Standard', 'S&D Competitive', 'Elimination');
DROP TABLE IF EXISTS room_configs;
DROP TYPE IF EXISTS game_mode;
DROP TYPE IF EXISTS room_status;
