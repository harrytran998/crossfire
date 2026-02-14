CREATE TYPE leaderboard_period AS ENUM ('daily', 'weekly', 'monthly', 'all_time');

CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    metric_key VARCHAR(32) NOT NULL,
    period_type leaderboard_period NOT NULL,
    game_mode game_mode,
    
    min_matches_required INTEGER DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    
    rank INTEGER NOT NULL,
    metric_value BIGINT NOT NULL,
    
    matches_count INTEGER NOT NULL DEFAULT 0,
    
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(leaderboard_id, player_id, period_start)
);

CREATE INDEX idx_entries_leaderboard ON leaderboard_entries (leaderboard_id, metric_value DESC);
CREATE INDEX idx_entries_player ON leaderboard_entries (player_id);
CREATE INDEX idx_entries_period ON leaderboard_entries (period_end);
