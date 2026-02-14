CREATE TABLE match_events (
    time TIMESTAMPTZ NOT NULL,
    match_id UUID NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    
    source_player_id UUID,
    target_player_id UUID,
    
    weapon_id UUID,
    damage_amount INTEGER,
    hit_zone VARCHAR(16),
    position_x FLOAT,
    position_y FLOAT,
    position_z FLOAT,
    
    round_number INTEGER,
    tick_number INTEGER,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_match_events_match ON match_events (match_id, time DESC);
CREATE INDEX idx_match_events_type ON match_events (event_type, time DESC);
CREATE INDEX idx_match_events_player ON match_events (source_player_id, time DESC);

CREATE TABLE player_telemetry (
    time TIMESTAMPTZ NOT NULL,
    player_id UUID NOT NULL,
    match_id UUID NOT NULL,
    
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    damage_dealt BIGINT DEFAULT 0,
    damage_received BIGINT DEFAULT 0,
    score INTEGER DEFAULT 0,
    
    ping_ms INTEGER,
    fps_avg INTEGER,
    packet_loss_pct DECIMAL(5,2)
);

CREATE INDEX idx_telemetry_player ON player_telemetry (player_id, time DESC);
CREATE INDEX idx_telemetry_match ON player_telemetry (match_id, time DESC);

CREATE TABLE server_metrics (
    time TIMESTAMPTZ NOT NULL,
    server_id VARCHAR(64) NOT NULL,
    
    cpu_percent DECIMAL(5,2),
    memory_mb BIGINT,
    
    connections INTEGER,
    bytes_in BIGINT,
    bytes_out BIGINT,
    
    active_rooms INTEGER,
    active_players INTEGER,
    tick_rate_avg DECIMAL(5,2)
);

CREATE INDEX idx_server_metrics_time ON server_metrics (server_id, time DESC);
