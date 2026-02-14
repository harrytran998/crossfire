-- Level definitions
CREATE TABLE levels (
    level INTEGER PRIMARY KEY,
    xp_required BIGINT NOT NULL UNIQUE,
    title VARCHAR(64) NOT NULL,
    rewards JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default levels
INSERT INTO levels (level, xp_required, title) VALUES
(1, 0, 'Recruit'),
(2, 500, 'Private'),
(3, 1200, 'Private First Class'),
(4, 2000, 'Corporal'),
(5, 3000, 'Sergeant'),
(10, 10000, 'Staff Sergeant'),
(15, 25000, 'Master Sergeant'),
(20, 50000, 'First Sergeant'),
(25, 85000, 'Sergeant Major'),
(30, 130000, 'Second Lieutenant'),
(40, 250000, 'First Lieutenant'),
(50, 400000, 'Captain'),
(60, 600000, 'Major'),
(70, 850000, 'Lieutenant Colonel'),
(80, 1150000, 'Colonel'),
(90, 1500000, 'Brigadier General'),
(100, 2000000, 'General');

-- Player progression
CREATE TABLE player_progression (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    
    current_level INTEGER NOT NULL DEFAULT 1,
    current_xp BIGINT NOT NULL DEFAULT 0,
    total_xp BIGINT NOT NULL DEFAULT 0,
    
    xp_multiplier DECIMAL(3,2) DEFAULT 1.0,
    xp_booster_expires TIMESTAMPTZ,
    
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- XP gain history
CREATE TABLE xp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    
    source VARCHAR(32) NOT NULL,
    match_id UUID,
    
    base_amount INTEGER NOT NULL,
    multiplier DECIMAL(3,2) DEFAULT 1.0,
    final_amount INTEGER NOT NULL,
    
    gained_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_progression_level ON player_progression (current_level DESC);
CREATE INDEX idx_xp_history_player ON xp_history (player_id, gained_at DESC);
