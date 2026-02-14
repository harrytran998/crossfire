CREATE TABLE player_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    weapon_id UUID NOT NULL REFERENCES weapons(id),
    
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_permanent BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    
    UNIQUE(player_id, weapon_id)
);

CREATE TABLE player_loadouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    
    name VARCHAR(64) NOT NULL DEFAULT 'Loadout 1',
    slot INTEGER NOT NULL DEFAULT 1,
    is_default BOOLEAN DEFAULT false,
    
    primary_weapon_id UUID REFERENCES player_inventory(id) ON DELETE SET NULL,
    secondary_weapon_id UUID REFERENCES player_inventory(id) ON DELETE SET NULL,
    melee_weapon_id UUID REFERENCES player_inventory(id) ON DELETE SET NULL,
    
    frag_grenades INTEGER DEFAULT 1,
    flash_grenades INTEGER DEFAULT 1,
    smoke_grenades INTEGER DEFAULT 0,
    
    primary_attachments UUID[] DEFAULT '{}',
    secondary_attachments UUID[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(player_id, slot)
);

CREATE INDEX idx_inventory_player ON player_inventory (player_id);
CREATE INDEX idx_loadouts_player ON player_loadouts (player_id);
CREATE INDEX idx_loadouts_default ON player_loadouts (player_id) WHERE is_default = true;
