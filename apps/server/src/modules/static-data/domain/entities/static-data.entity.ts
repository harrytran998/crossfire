import type { Maps, WeaponAttachments, Weapons } from '@crossfire/database'

export type WeaponRow = Weapons
export type WeaponAttachmentRow = WeaponAttachments
export type MapRow = Maps

export interface Weapon {
  readonly id: string
  readonly key: string
  readonly name: string
  readonly type: string
  readonly rarity: string
  readonly baseDamage: number
  readonly unlockLevel: number | null
  readonly unlockCost: number | null
  readonly isActive: boolean
}

export interface WeaponAttachment {
  readonly id: string
  readonly weaponId: string | null
  readonly attachmentType: string
  readonly name: string
  readonly unlockLevel: number | null
  readonly isActive: boolean
}

export interface GameMap {
  readonly id: string
  readonly key: string
  readonly name: string
  readonly maxPlayers: number
  readonly supportedModes: readonly string[]
  readonly sizeCategory: string | null
  readonly isActive: boolean
}

export const mapWeaponRowToEntity = (row: WeaponRow): Weapon => ({
  id: row.id as unknown as string,
  key: row.weapon_key,
  name: row.name,
  type: row.weapon_type as unknown as string,
  rarity: row.rarity as unknown as string,
  baseDamage: row.base_damage,
  unlockLevel: row.unlock_level as unknown as number | null,
  unlockCost: row.unlock_cost as unknown as number | null,
  isActive: row.is_active as unknown as boolean,
})

export const mapWeaponAttachmentRowToEntity = (row: WeaponAttachmentRow): WeaponAttachment => ({
  id: row.id as unknown as string,
  weaponId: row.weapon_id,
  attachmentType: row.attachment_type,
  name: row.name,
  unlockLevel: row.unlock_level as unknown as number | null,
  isActive: (row.is_active as unknown as boolean | null) ?? true,
})

export const mapMapRowToEntity = (row: MapRow): GameMap => ({
  id: row.id as unknown as string,
  key: row.map_key,
  name: row.name,
  maxPlayers: row.max_players,
  supportedModes: row.supported_modes,
  sizeCategory: row.size_category,
  isActive: (row.is_active as unknown as boolean | null) ?? true,
})
