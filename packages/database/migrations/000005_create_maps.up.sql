CREATE TABLE maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_key VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(512),
    
    max_players INTEGER NOT NULL,
    supported_modes TEXT[] NOT NULL,
    size_category VARCHAR(16),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO maps (map_key, name, max_players, supported_modes, size_category) VALUES
('desert_storm', 'Desert Storm', 16, ARRAY['team_deathmatch', 'free_for_all'], 'medium'),
('black_widow', 'Black Widow', 10, ARRAY['search_destroy', 'elimination'], 'small'),
('eagle_eye', 'Eagle Eye', 16, ARRAY['team_deathmatch', 'search_destroy'], 'large'),
('factory', 'Factory', 12, ARRAY['team_deathmatch', 'free_for_all', 'search_destroy'], 'medium');
