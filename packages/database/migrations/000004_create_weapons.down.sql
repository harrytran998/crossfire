DROP INDEX IF EXISTS idx_attachments_weapon;
DROP INDEX IF EXISTS idx_weapons_unlock;
DROP INDEX IF EXISTS idx_weapons_rarity;
DROP INDEX IF EXISTS idx_weapons_type;

DROP TABLE IF EXISTS weapon_attachments;
DROP TABLE IF EXISTS weapons;
DROP TYPE IF EXISTS weapon_rarity;
DROP TYPE IF EXISTS weapon_type;
