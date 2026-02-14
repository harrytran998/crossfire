CREATE TYPE weapon_type AS ENUM (
    'assault_rifle', 'smg', 'sniper', 'shotgun', 
    'machine_gun', 'pistol', 'melee', 'grenade'
);

CREATE TYPE weapon_rarity AS ENUM (
    'common', 'uncommon', 'rare', 'epic', 'legendary'
);

CREATE TABLE weapons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weapon_key VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    
    weapon_type weapon_type NOT NULL,
    rarity weapon_rarity NOT NULL DEFAULT 'common',
    
    base_damage INTEGER NOT NULL,
    fire_rate DECIMAL(6,2),
    magazine_size INTEGER,
    reload_time DECIMAL(4,2),
    accuracy DECIMAL(4,3),
    range_meters INTEGER,
    move_speed_modifier DECIMAL(3,2) DEFAULT 1.0,
    
    unlock_level INTEGER DEFAULT 1,
    unlock_cost INTEGER DEFAULT 0,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    stats JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE weapon_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weapon_id UUID REFERENCES weapons(id) ON DELETE CASCADE,
    
    attachment_type VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    
    stat_modifiers JSONB NOT NULL DEFAULT '{}',
    
    unlock_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_weapons_type ON weapons (weapon_type);
CREATE INDEX idx_weapons_rarity ON weapons (rarity);
CREATE INDEX idx_weapons_unlock ON weapons (unlock_level);
CREATE INDEX idx_attachments_weapon ON weapon_attachments (weapon_id);
