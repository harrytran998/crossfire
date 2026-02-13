# Database Schema Design

## Crossfire Web Game - PostgreSQL Schema

---

## 1. Overview

This document defines the complete PostgreSQL database schema for the Crossfire web game, supporting:
- Player management and authentication
- Game rooms and matchmaking
- Match history and statistics
- Weapons and inventory system
- Progression and leaderboards

---

## 2. Database Configuration

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search
```

---

## 3. Core Schema

### 3.1 Users & Authentication

```sql
-- Users table (authentication credentials)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    
    -- Account status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_banned BOOLEAN NOT NULL DEFAULT false,
    banned_until TIMESTAMPTZ,
    ban_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    
    -- Session lifecycle
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_active ON users (is_active) WHERE is_banned = false;
CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_token ON sessions (refresh_token);
CREATE INDEX idx_sessions_active ON sessions (user_id, expires_at) 
    WHERE revoked_at IS NULL;
```

### 3.2 Players & Profiles

```sql
-- Players table (game profile)
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Profile info
    display_name VARCHAR(64) NOT NULL,
    avatar_url VARCHAR(512),
    bio TEXT,
    
    -- Preferences
    region VARCHAR(16) DEFAULT 'ASIA',
    language VARCHAR(8) DEFAULT 'en',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Player statistics (cumulative)
CREATE TABLE player_stats (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    
    -- Match stats
    total_matches INTEGER NOT NULL DEFAULT 0,
    matches_won INTEGER NOT NULL DEFAULT 0,
    matches_lost INTEGER NOT NULL DEFAULT 0,
    
    -- Combat stats
    total_kills BIGINT NOT NULL DEFAULT 0,
    total_deaths BIGINT NOT NULL DEFAULT 0,
    total_assists BIGINT NOT NULL DEFAULT 0,
    total_headshots BIGINT NOT NULL DEFAULT 0,
    
    -- Damage stats
    total_damage_dealt BIGINT NOT NULL DEFAULT 0,
    total_damage_received BIGINT NOT NULL DEFAULT 0,
    
    -- Score & time
    total_score BIGINT NOT NULL DEFAULT 0,
    playtime_seconds BIGINT NOT NULL DEFAULT 0,
    
    -- Mode-specific stats stored as JSONB
    mode_stats JSONB DEFAULT '{}',
    
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_players_user ON players (user_id);
CREATE INDEX idx_players_name ON players (display_name);
CREATE INDEX idx_players_region ON players (region);
CREATE INDEX idx_stats_kills ON player_stats (total_kills DESC);
CREATE INDEX idx_stats_wins ON player_stats (matches_won DESC);
```

### 3.3 Progression System

```sql
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
    
    -- Current state
    current_level INTEGER NOT NULL DEFAULT 1,
    current_xp BIGINT NOT NULL DEFAULT 0,
    total_xp BIGINT NOT NULL DEFAULT 0,
    
    -- Boosters
    xp_multiplier DECIMAL(3,2) DEFAULT 1.0,
    xp_booster_expires TIMESTAMPTZ,
    
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- XP gain history
CREATE TABLE xp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    
    -- Source
    source VARCHAR(32) NOT NULL, -- 'match', 'daily_bonus', 'achievement', 'event'
    match_id UUID REFERENCES matches(id),
    
    -- Amount
    base_amount INTEGER NOT NULL,
    multiplier DECIMAL(3,2) DEFAULT 1.0,
    final_amount INTEGER NOT NULL,
    
    gained_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_progression_level ON player_progression (current_level DESC);
CREATE INDEX idx_xp_history_player ON xp_history (player_id, gained_at DESC);
```

---

## 4. Game Data

### 4.1 Weapons Catalog

```sql
-- Weapon types enum
CREATE TYPE weapon_type AS ENUM (
    'assault_rifle', 'smg', 'sniper', 'shotgun', 
    'machine_gun', 'pistol', 'melee', 'grenade'
);

-- Weapon rarities
CREATE TYPE weapon_rarity AS ENUM (
    'common', 'uncommon', 'rare', 'epic', 'legendary'
);

-- Weapons master table
CREATE TABLE weapons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weapon_key VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    
    -- Classification
    weapon_type weapon_type NOT NULL,
    rarity weapon_rarity NOT NULL DEFAULT 'common',
    
    -- Stats
    base_damage INTEGER NOT NULL,
    fire_rate DECIMAL(6,2), -- rounds per second
    magazine_size INTEGER,
    reload_time DECIMAL(4,2), -- seconds
    accuracy DECIMAL(4,3), -- 0.0 to 1.0
    range_meters INTEGER,
    move_speed_modifier DECIMAL(3,2) DEFAULT 1.0,
    
    -- Unlock
    unlock_level INTEGER DEFAULT 1,
    unlock_cost INTEGER DEFAULT 0,
    
    -- State
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Flexible stats (recoil pattern, etc.)
    stats JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weapon attachments
CREATE TABLE weapon_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weapon_id UUID REFERENCES weapons(id) ON DELETE CASCADE,
    
    attachment_type VARCHAR(32) NOT NULL, -- 'scope', 'barrel', 'magazine', 'grip', 'stock'
    name VARCHAR(128) NOT NULL,
    
    -- Stat modifiers
    stat_modifiers JSONB NOT NULL DEFAULT '{}',
    -- Example: {"damage": 1.1, "accuracy": 0.95, "reload_time": 0.9}
    
    unlock_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_weapons_type ON weapons (weapon_type);
CREATE INDEX idx_weapons_rarity ON weapons (rarity);
CREATE INDEX idx_weapons_unlock ON weapons (unlock_level);
CREATE INDEX idx_attachments_weapon ON weapon_attachments (weapon_id);
```

### 4.2 Maps

```sql
-- Maps table
CREATE TABLE maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_key VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(512),
    
    -- Map config
    max_players INTEGER NOT NULL,
    supported_modes TEXT[] NOT NULL, -- Array of game modes
    size_category VARCHAR(16), -- 'small', 'medium', 'large'
    
    -- State
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default maps
INSERT INTO maps (map_key, name, max_players, supported_modes, size_category) VALUES
('desert_storm', 'Desert Storm', 16, ARRAY['team_deathmatch', 'free_for_all'], 'medium'),
('black_widow', 'Black Widow', 10, ARRAY['search_destroy', 'elimination'], 'small'),
('eagle_eye', 'Eagle Eye', 16, ARRAY['team_deathmatch', 'search_destroy'], 'large'),
('factory', 'Factory', 12, ARRAY['team_deathmatch', 'free_for_all', 'search_destroy'], 'medium');
```

### 4.3 Player Inventory & Loadouts

```sql
-- Player inventory (owned weapons)
CREATE TABLE player_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    weapon_id UUID NOT NULL REFERENCES weapons(id),
    
    -- Ownership
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_permanent BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ, -- For rental items
    
    UNIQUE(player_id, weapon_id)
);

-- Player loadouts
CREATE TABLE player_loadouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    
    -- Loadout config
    name VARCHAR(64) NOT NULL DEFAULT 'Loadout 1',
    slot INTEGER NOT NULL DEFAULT 1,
    is_default BOOLEAN DEFAULT false,
    
    -- Weapons (references to inventory)
    primary_weapon_id UUID REFERENCES player_inventory(id) ON DELETE SET NULL,
    secondary_weapon_id UUID REFERENCES player_inventory(id) ON DELETE SET NULL,
    melee_weapon_id UUID REFERENCES player_inventory(id) ON DELETE SET NULL,
    
    -- Grenades (counts)
    frag_grenades INTEGER DEFAULT 1,
    flash_grenades INTEGER DEFAULT 1,
    smoke_grenades INTEGER DEFAULT 0,
    
    -- Attachments
    primary_attachments UUID[] DEFAULT '{}',
    secondary_attachments UUID[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(player_id, slot)
);

-- Indexes
CREATE INDEX idx_inventory_player ON player_inventory (player_id);
CREATE INDEX idx_loadouts_player ON player_loadouts (player_id);
CREATE INDEX idx_loadouts_default ON player_loadouts (player_id) WHERE is_default = true;
```

### 4.4 TimescaleDB for Real-Time Analytics

```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Match events hypertable (kills, deaths, damage, objectives)
CREATE TABLE match_events (
    time TIMESTAMPTZ NOT NULL,
    match_id UUID NOT NULL,
    event_type VARCHAR(32) NOT NULL, -- 'kill', 'death', 'damage', 'objective', 'ability'
    
    -- Players involved
    source_player_id UUID,
    target_player_id UUID,
    
    -- Event details
    weapon_id UUID,
    damage_amount INTEGER,
    hit_zone VARCHAR(16),
    position_x FLOAT,
    position_y FLOAT,
    position_z FLOAT,
    
    -- Metadata
    round_number INTEGER,
    tick_number INTEGER,
    metadata JSONB DEFAULT '{}'
);

-- Convert to hypertable
SELECT create_hypertable('match_events', 'time');

-- Create indexes
CREATE INDEX idx_match_events_match ON match_events (match_id, time DESC);
CREATE INDEX idx_match_events_type ON match_events (event_type, time DESC);
CREATE INDEX idx_match_events_player ON match_events (source_player_id, time DESC);

-- Player telemetry hypertable (real-time stats aggregation)
CREATE TABLE player_telemetry (
    time TIMESTAMPTZ NOT NULL,
    player_id UUID NOT NULL,
    match_id UUID NOT NULL,
    
    -- Per-interval stats
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    damage_dealt BIGINT DEFAULT 0,
    damage_received BIGINT DEFAULT 0,
    score INTEGER DEFAULT 0,
    
    -- Performance metrics
    ping_ms INTEGER,
    fps_avg INTEGER,
    packet_loss_pct DECIMAL(5,2)
);

SELECT create_hypertable('player_telemetry', 'time');

-- Server metrics hypertable
CREATE TABLE server_metrics (
    time TIMESTAMPTZ NOT NULL,
    server_id VARCHAR(64) NOT NULL,
    
    -- Resource usage
    cpu_percent DECIMAL(5,2),
    memory_mb BIGINT,
    
    -- Network
    connections INTEGER,
    bytes_in BIGINT,
    bytes_out BIGINT,
    
    -- Game metrics
    active_rooms INTEGER,
    active_players INTEGER,
    tick_rate_avg DECIMAL(5,2)
);

SELECT create_hypertable('server_metrics', 'time');
```

#### Continuous Aggregates

```sql
-- Real-time kill feed aggregate (last 5 minutes)
CREATE MATERIALIZED VIEW kill_feed_recent
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 minute', time) AS bucket,
    match_id,
    source_player_id AS killer_id,
    target_player_id AS victim_id,
    weapon_id,
    COUNT(*) AS kill_count
FROM match_events
WHERE event_type = 'kill'
GROUP BY bucket, match_id, source_player_id, target_player_id, weapon_id
WITH DATA;

-- Refresh policy
SELECT add_continuous_aggregate_policy('kill_feed_recent',
    start_offset => INTERVAL '10 minutes',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute');

-- Hourly player stats aggregate
CREATE MATERIALIZED VIEW player_stats_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS bucket,
    player_id,
    SUM(kills) AS kills,
    SUM(deaths) AS deaths,
    SUM(damage_dealt) AS damage_dealt,
    AVG(ping_ms) AS avg_ping
FROM player_telemetry
GROUP BY bucket, player_id
WITH DATA;
```

#### Retention Policies

```sql
-- Keep raw events for 30 days, aggregates for 1 year
SELECT add_retention_policy('match_events', INTERVAL '30 days');
SELECT add_retention_policy('player_telemetry', INTERVAL '30 days');
SELECT add_retention_policy('server_metrics', INTERVAL '7 days');
```

---

## 5. Multiplayer Systems

### 5.1 Game Rooms

```sql
-- Room status enum
CREATE TYPE room_status AS ENUM (
    'waiting', 'starting', 'in_progress', 'completed', 'cancelled'
);

-- Game modes enum
CREATE TYPE game_mode AS ENUM (
    'team_deathmatch', 'free_for_all', 'search_destroy', 
    'elimination', 'mutation', 'zombie'
);

-- Room configurations (templates)
CREATE TABLE room_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,
    game_mode game_mode NOT NULL,
    
    -- Player limits
    min_players INTEGER NOT NULL DEFAULT 2,
    max_players INTEGER NOT NULL DEFAULT 16,
    
    -- Match settings
    time_limit_seconds INTEGER,
    score_limit INTEGER,
    round_limit INTEGER,
    
    -- Flags
    is_ranked BOOLEAN DEFAULT false,
    is_official BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default configs
INSERT INTO room_configs (name, game_mode, min_players, max_players, time_limit_seconds, score_limit) VALUES
('TDM Standard', 'team_deathmatch', 4, 16, 600, 60),
('TDM Quick', 'team_deathmatch', 2, 8, 300, 40),
('FFA Standard', 'free_for_all', 4, 12, 600, 30),
('S&D Competitive', 'search_destroy', 6, 10, 180, NULL),
('Elimination', 'elimination', 4, 10, 120, NULL);

-- Active game rooms (also stored in Redis for real-time)
CREATE TABLE game_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES room_configs(id),
    map_id UUID NOT NULL REFERENCES maps(id),
    host_player_id UUID NOT NULL REFERENCES players(id),
    
    -- Room info
    room_code VARCHAR(8) UNIQUE,
    name VARCHAR(128),
    password_hash VARCHAR(255), -- For private rooms
    
    -- State
    status room_status NOT NULL DEFAULT 'waiting',
    current_players INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Room participants
CREATE TABLE room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id),
    
    -- Participant state
    team INTEGER, -- 0 = unassigned, 1 = team 1, 2 = team 2
    is_ready BOOLEAN DEFAULT false,
    loadout_id UUID REFERENCES player_loadouts(id),
    
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    
    UNIQUE(room_id, player_id)
);

-- Indexes
CREATE INDEX idx_rooms_status ON game_rooms (status, created_at);
CREATE INDEX idx_rooms_code ON game_rooms (room_code) WHERE room_code IS NOT NULL;
CREATE INDEX idx_rooms_host ON game_rooms (host_player_id);
CREATE INDEX idx_participants_room ON room_participants (room_id);
CREATE INDEX idx_participants_player ON room_participants (player_id, joined_at DESC);
```

### 5.2 Match History

```sql
-- Matches (completed games)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES game_rooms(id),
    
    -- Match info
    game_mode game_mode NOT NULL,
    map_id UUID NOT NULL REFERENCES maps(id),
    
    -- Results
    winning_team INTEGER, -- NULL for FFA, team number for team modes
    mvp_player_id UUID REFERENCES players(id),
    
    -- Duration
    duration_seconds INTEGER NOT NULL,
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Match participants (per-player stats)
CREATE TABLE match_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id),
    
    -- Team
    team INTEGER,
    
    -- Performance
    kills INTEGER NOT NULL DEFAULT 0,
    deaths INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    headshots INTEGER NOT NULL DEFAULT 0,
    
    -- Score
    score INTEGER NOT NULL DEFAULT 0,
    damage_dealt BIGINT NOT NULL DEFAULT 0,
    damage_received BIGINT NOT NULL DEFAULT 0,
    
    -- Result
    is_winner BOOLEAN NOT NULL DEFAULT false,
    position INTEGER, -- Final standing (for FFA)
    
    -- Rewards
    xp_gained INTEGER NOT NULL DEFAULT 0,
    
    -- Time
    playtime_seconds INTEGER NOT NULL DEFAULT 0,
    
    -- Detailed stats (weapon usage, etc.)
    detailed_stats JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Match weapon usage
CREATE TABLE match_weapon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_participant_id UUID NOT NULL REFERENCES match_participants(id) ON DELETE CASCADE,
    weapon_id UUID NOT NULL REFERENCES weapons(id),
    
    -- Stats
    kills INTEGER DEFAULT 0,
    shots_fired INTEGER DEFAULT 0,
    shots_hit INTEGER DEFAULT 0,
    headshots INTEGER DEFAULT 0,
    damage_dealt BIGINT DEFAULT 0,
    
    UNIQUE(match_participant_id, weapon_id)
);

-- Indexes
CREATE INDEX idx_matches_mode ON matches (game_mode, completed_at DESC);
CREATE INDEX idx_matches_map ON matches (map_id, completed_at DESC);
CREATE INDEX idx_matches_player ON match_participants (player_id, completed_at DESC);
CREATE INDEX idx_weapon_usage_participant ON match_weapon_usage (match_participant_id);
```

---

## 6. Social & Leaderboards

### 6.1 Friends System

```sql
-- Friendships
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    
    -- Status
    status VARCHAR(16) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

-- Indexes
CREATE INDEX idx_friendships_requester ON friendships (requester_id);
CREATE INDEX idx_friendships_addressee ON friendships (addressee_id);
CREATE INDEX idx_friendships_accepted ON friendships (requester_id, addressee_id) 
    WHERE status = 'accepted';
```

### 6.2 Leaderboards

```sql
-- Leaderboard types
CREATE TYPE leaderboard_period AS ENUM ('daily', 'weekly', 'monthly', 'all_time');

-- Leaderboard definitions
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    metric_key VARCHAR(32) NOT NULL, -- 'kills', 'wins', 'score', 'kd_ratio'
    period_type leaderboard_period NOT NULL,
    game_mode game_mode,
    
    -- Settings
    min_matches_required INTEGER DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leaderboard entries (updated by background job)
CREATE TABLE leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    
    -- Ranking
    rank INTEGER NOT NULL,
    metric_value BIGINT NOT NULL,
    
    -- Metadata
    matches_count INTEGER NOT NULL DEFAULT 0,
    
    -- Period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(leaderboard_id, player_id, period_start)
);

-- Materialized view for fast leaderboard queries
CREATE MATERIALIZED VIEW leaderboard_rankings AS
SELECT 
    le.leaderboard_id,
    le.player_id,
    p.display_name,
    le.metric_value,
    le.rank,
    l.name as leaderboard_name,
    l.metric_key
FROM leaderboard_entries le
JOIN leaderboards l ON le.leaderboard_id = l.id
JOIN players p ON le.player_id = p.id
WHERE l.is_active = true
ORDER BY le.leaderboard_id, le.rank;

CREATE UNIQUE INDEX idx_rankings_unique ON leaderboard_rankings (leaderboard_id, player_id);

-- Refresh function (call periodically)
CREATE OR REPLACE FUNCTION refresh_leaderboards()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_rankings;
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX idx_entries_leaderboard ON leaderboard_entries (leaderboard_id, metric_value DESC);
CREATE INDEX idx_entries_player ON leaderboard_entries (player_id);
CREATE INDEX idx_entries_period ON leaderboard_entries (period_end);
```

---

## 7. Achievements

```sql
-- Achievement categories
CREATE TYPE achievement_category AS ENUM (
    'combat', 'social', 'progression', 'special', 'hidden'
);

-- Achievements
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_key VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    category achievement_category NOT NULL,
    
    -- Rewards
    xp_reward INTEGER NOT NULL DEFAULT 0,
    
    -- Display
    icon_url VARCHAR(512),
    sort_order INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Achievement criteria
CREATE TABLE achievement_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    
    -- Condition
    condition_key VARCHAR(64) NOT NULL, -- 'kills_total', 'wins_streak', 'headshots_total'
    target_value INTEGER NOT NULL,
    operator VARCHAR(8) DEFAULT '>=', -- '>=', '=', '>'
    
    -- Optional params
    game_mode game_mode, -- NULL = any mode
    weapon_type weapon_type, -- NULL = any weapon
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Player achievements (unlocked)
CREATE TABLE player_achievements (
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    
    -- Progress (for multi-criteria achievements)
    progress JSONB DEFAULT '{}',
    
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (player_id, achievement_id)
);

-- Insert default achievements
INSERT INTO achievements (achievement_key, name, description, category, xp_reward) VALUES
('first_blood', 'First Blood', 'Get your first kill', 'combat', 100),
('kill_100', 'Assassin', 'Kill 100 enemies', 'combat', 500),
('kill_1000', 'Mass Murderer', 'Kill 1,000 enemies', 'combat', 2000),
('headshot_50', 'Sharpshooter', 'Get 50 headshots', 'combat', 300),
('win_10', 'Victorious', 'Win 10 matches', 'combat', 200),
('win_100', 'Champion', 'Win 100 matches', 'combat', 1000),
('level_50', 'Veteran', 'Reach level 50', 'progression', 1500),
('friend_5', 'Social Butterfly', 'Add 5 friends', 'social', 100);

-- Insert achievement criteria
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

-- Indexes
CREATE INDEX idx_achievements_category ON achievements (category);
CREATE INDEX idx_player_achievements_player ON player_achievements (player_id);
CREATE INDEX idx_criteria_achievement ON achievement_criteria (achievement_id);
```

---

## 8. Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     users       │───────│   players       │
│                 │ 1:1   │                 │
└─────────────────┘       └────────┬────────┘
         │                         │
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│    sessions     │       │  player_stats   │
└─────────────────┘       └─────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
          ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
          │player_inventory│ │player_loadouts│ │player_progression│
          └──────────────┘ └──────────────┘ └──────────────┘
                    │
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   weapons    │ │     maps     │ │room_configs  │
└──────────────┘ └──────────────┘ └──────────────┘
                                    │
                                    │
                                    ▼
                          ┌─────────────────┐
                          │   game_rooms    │
                          └────────┬────────┘
                                   │
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
          ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
          │room_participants│ │   matches    │ │leaderboards  │
          └──────────────┘ └──────────────┘ └──────────────┘
                                   │
                                   │
                                   ▼
                          ┌─────────────────┐
                          │match_participants│
                          └─────────────────┘
```

---

## 9. Useful Queries

### Player Statistics
```sql
-- Get player with full stats
SELECT 
    p.display_name,
    p.region,
    pp.current_level,
    pp.total_xp,
    ps.total_matches,
    ps.matches_won,
    ps.total_kills,
    ps.total_deaths,
    ROUND(ps.total_kills::decimal / NULLIF(ps.total_deaths, 0), 2) as kd_ratio
FROM players p
JOIN player_progression pp ON p.id = pp.player_id
JOIN player_stats ps ON p.id = ps.player_id
WHERE p.id = $1;

-- Update player stats after match
UPDATE player_stats SET
    total_matches = total_matches + 1,
    matches_won = matches_won + CASE WHEN $2 THEN 1 ELSE 0 END,
    total_kills = total_kills + $3,
    total_deaths = total_deaths + $4,
    total_score = total_score + $5,
    playtime_seconds = playtime_seconds + $6,
    last_updated = NOW()
WHERE player_id = $1;
```

### Leaderboard Queries
```sql
-- Get top 100 players for a leaderboard
SELECT 
    rank,
    display_name,
    metric_value
FROM leaderboard_rankings
WHERE leaderboard_id = $1
ORDER BY rank
LIMIT 100;

-- Get player's rank
SELECT rank, metric_value
FROM leaderboard_entries
WHERE leaderboard_id = $1 AND player_id = $2;

-- Get player's position around them
WITH player_rank AS (
    SELECT rank FROM leaderboard_entries
    WHERE leaderboard_id = $1 AND player_id = $2
)
SELECT le.rank, p.display_name, le.metric_value
FROM leaderboard_entries le
JOIN players p ON le.player_id = p.id
WHERE le.leaderboard_id = $1
  AND le.rank BETWEEN (SELECT rank FROM player_rank) - 5 
                   AND (SELECT rank FROM player_rank) + 5
ORDER BY le.rank;
```

### Match History
```sql
-- Get player's recent matches
SELECT 
    m.completed_at,
    m.game_mode,
    map.name as map_name,
    mp.kills,
    mp.deaths,
    mp.assists,
    mp.score,
    mp.is_winner
FROM match_participants mp
JOIN matches m ON mp.match_id = m.id
JOIN maps map ON m.map_id = map.id
WHERE mp.player_id = $1
ORDER BY m.completed_at DESC
LIMIT 20;
```

---

## 10. Database Maintenance

### Regular Tasks
```sql
-- Vacuum analyze tables (run weekly)
VACUUM ANALYZE player_stats;
VACUUM ANALYZE match_participants;
VACUUM ANALYZE leaderboard_entries;

-- Refresh materialized views (run every 5 minutes)
SELECT refresh_leaderboards();

-- Clean up old sessions (run daily)
DELETE FROM sessions 
WHERE expires_at < NOW() OR revoked_at IS NOT NULL;

-- Archive old matches (run monthly)
-- Move matches older than 6 months to archive table
```

### Index Maintenance
```sql
-- Reindex if needed
REINDEX INDEX idx_stats_kills;
REINDEX INDEX idx_matches_player;
```

---

*Document Version: 1.0*
*Last Updated: February 2026*
