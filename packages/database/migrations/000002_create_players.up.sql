-- Players table (game profile)
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    display_name VARCHAR(64) NOT NULL,
    avatar_url VARCHAR(512),
    bio TEXT,
    
    region VARCHAR(16) DEFAULT 'ASIA',
    language VARCHAR(8) DEFAULT 'en',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Player statistics (cumulative)
CREATE TABLE player_stats (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    
    total_matches INTEGER NOT NULL DEFAULT 0,
    matches_won INTEGER NOT NULL DEFAULT 0,
    matches_lost INTEGER NOT NULL DEFAULT 0,
    
    total_kills BIGINT NOT NULL DEFAULT 0,
    total_deaths BIGINT NOT NULL DEFAULT 0,
    total_assists BIGINT NOT NULL DEFAULT 0,
    total_headshots BIGINT NOT NULL DEFAULT 0,
    
    total_damage_dealt BIGINT NOT NULL DEFAULT 0,
    total_damage_received BIGINT NOT NULL DEFAULT 0,
    
    total_score BIGINT NOT NULL DEFAULT 0,
    playtime_seconds BIGINT NOT NULL DEFAULT 0,
    
    mode_stats JSONB DEFAULT '{}',
    
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_players_user ON players (user_id);
CREATE INDEX idx_players_name ON players (display_name);
CREATE INDEX idx_players_region ON players (region);
CREATE INDEX idx_stats_kills ON player_stats (total_kills DESC);
CREATE INDEX idx_stats_wins ON player_stats (matches_won DESC);
