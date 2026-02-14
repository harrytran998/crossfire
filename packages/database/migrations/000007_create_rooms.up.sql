CREATE TYPE room_status AS ENUM (
    'waiting', 'starting', 'in_progress', 'completed', 'cancelled'
);

CREATE TYPE game_mode AS ENUM (
    'team_deathmatch', 'free_for_all', 'search_destroy', 
    'elimination', 'mutation', 'zombie'
);

CREATE TABLE room_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,
    game_mode game_mode NOT NULL,
    
    min_players INTEGER NOT NULL DEFAULT 2,
    max_players INTEGER NOT NULL DEFAULT 16,
    
    time_limit_seconds INTEGER,
    score_limit INTEGER,
    round_limit INTEGER,
    
    is_ranked BOOLEAN DEFAULT false,
    is_official BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO room_configs (name, game_mode, min_players, max_players, time_limit_seconds, score_limit) VALUES
('TDM Standard', 'team_deathmatch', 4, 16, 600, 60),
('TDM Quick', 'team_deathmatch', 2, 8, 300, 40),
('FFA Standard', 'free_for_all', 4, 12, 600, 30),
('S&D Competitive', 'search_destroy', 6, 10, 180, NULL),
('Elimination', 'elimination', 4, 10, 120, NULL);

CREATE TABLE game_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES room_configs(id),
    map_id UUID NOT NULL REFERENCES maps(id),
    host_player_id UUID NOT NULL REFERENCES players(id),
    
    room_code VARCHAR(8) UNIQUE,
    name VARCHAR(128),
    password_hash VARCHAR(255),
    
    status room_status NOT NULL DEFAULT 'waiting',
    current_players INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE TABLE room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id),
    
    team INTEGER,
    is_ready BOOLEAN DEFAULT false,
    loadout_id UUID REFERENCES player_loadouts(id),
    
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    
    UNIQUE(room_id, player_id)
);

CREATE INDEX idx_rooms_status ON game_rooms (status, created_at);
CREATE INDEX idx_rooms_code ON game_rooms (room_code) WHERE room_code IS NOT NULL;
CREATE INDEX idx_rooms_host ON game_rooms (host_player_id);
CREATE INDEX idx_participants_room ON room_participants (room_id);
CREATE INDEX idx_participants_player ON room_participants (player_id, joined_at DESC);
