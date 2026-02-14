CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES game_rooms(id),
    
    game_mode game_mode NOT NULL,
    map_id UUID NOT NULL REFERENCES maps(id),
    
    winning_team INTEGER,
    mvp_player_id UUID REFERENCES players(id),
    
    duration_seconds INTEGER NOT NULL,
    
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE match_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id),
    
    team INTEGER,
    
    kills INTEGER NOT NULL DEFAULT 0,
    deaths INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    headshots INTEGER NOT NULL DEFAULT 0,
    
    score INTEGER NOT NULL DEFAULT 0,
    damage_dealt BIGINT NOT NULL DEFAULT 0,
    damage_received BIGINT NOT NULL DEFAULT 0,
    
    is_winner BOOLEAN NOT NULL DEFAULT false,
    position INTEGER,
    
    xp_gained INTEGER NOT NULL DEFAULT 0,
    
    playtime_seconds INTEGER NOT NULL DEFAULT 0,
    
    detailed_stats JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE match_weapon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_participant_id UUID NOT NULL REFERENCES match_participants(id) ON DELETE CASCADE,
    weapon_id UUID NOT NULL REFERENCES weapons(id),
    
    kills INTEGER DEFAULT 0,
    shots_fired INTEGER DEFAULT 0,
    shots_hit INTEGER DEFAULT 0,
    headshots INTEGER DEFAULT 0,
    damage_dealt BIGINT DEFAULT 0,
    
    UNIQUE(match_participant_id, weapon_id)
);

CREATE INDEX idx_matches_mode ON matches (game_mode, completed_at DESC);
CREATE INDEX idx_matches_map ON matches (map_id, completed_at DESC);
CREATE INDEX idx_matches_player ON match_participants (player_id, created_at DESC);
CREATE INDEX idx_weapon_usage_participant ON match_weapon_usage (match_participant_id);
