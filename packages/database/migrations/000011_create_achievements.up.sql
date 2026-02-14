CREATE TYPE achievement_category AS ENUM (
    'combat', 'social', 'progression', 'special', 'hidden'
);

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_key VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    category achievement_category NOT NULL,
    
    xp_reward INTEGER NOT NULL DEFAULT 0,
    
    icon_url VARCHAR(512),
    sort_order INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE achievement_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    
    condition_key VARCHAR(64) NOT NULL,
    target_value INTEGER NOT NULL,
    operator VARCHAR(8) DEFAULT '>=',
    
    game_mode game_mode,
    weapon_type weapon_type,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE player_achievements (
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    
    progress JSONB DEFAULT '{}',
    
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (player_id, achievement_id)
);

INSERT INTO achievements (achievement_key, name, description, category, xp_reward) VALUES
('first_blood', 'First Blood', 'Get your first kill', 'combat', 100),
('kill_100', 'Assassin', 'Kill 100 enemies', 'combat', 500),
('kill_1000', 'Mass Murderer', 'Kill 1,000 enemies', 'combat', 2000),
('headshot_50', 'Sharpshooter', 'Get 50 headshots', 'combat', 300),
('win_10', 'Victorious', 'Win 10 matches', 'combat', 200),
('win_100', 'Champion', 'Win 100 matches', 'combat', 1000),
('level_50', 'Veteran', 'Reach level 50', 'progression', 1500),
('friend_5', 'Social Butterfly', 'Add 5 friends', 'social', 100);

INSERT INTO achievement_criteria (achievement_id, condition_key, target_value)
SELECT id, 'kills', 1 FROM achievements WHERE achievement_key = 'first_blood'
UNION ALL
SELECT id, 'kills', 100 FROM achievements WHERE achievement_key = 'kill_100'
UNION ALL
SELECT id, 'kills', 1000 FROM achievements WHERE achievement_key = 'kill_1000'
UNION ALL
SELECT id, 'headshots', 50 FROM achievements WHERE achievement_key = 'headshot_50'
UNION ALL
SELECT id, 'wins', 10 FROM achievements WHERE achievement_key = 'win_10'
UNION ALL
SELECT id, 'wins', 100 FROM achievements WHERE achievement_key = 'win_100'
UNION ALL
SELECT id, 'level', 50 FROM achievements WHERE achievement_key = 'level_50'
UNION ALL
SELECT id, 'friends', 5 FROM achievements WHERE achievement_key = 'friend_5';

CREATE INDEX idx_achievements_category ON achievements (category);
CREATE INDEX idx_player_achievements_player ON player_achievements (player_id);
CREATE INDEX idx_criteria_achievement ON achievement_criteria (achievement_id);
