import type { PlayerInventory } from '@crossfire/database'

export type PlayerInventoryRow = PlayerInventory

export interface InventoryItem {
  readonly id: string
  readonly playerId: string
  readonly weaponId: string
  readonly weaponKey: string
  readonly weaponName: string
  readonly weaponType: string
  readonly weaponRarity: string
  readonly acquiredAt: Date
  readonly isPermanent: boolean
  readonly expiresAt: Date | null
}

export interface AcquireInventoryInput {
  readonly playerId: string
  readonly weaponId: string
  readonly isPermanent?: boolean | undefined
  readonly expiresAt?: Date | null | undefined
}

export type InventoryJoinedRow = PlayerInventoryRow & {
  readonly weapon_key: string
  readonly weapon_name: string
  readonly weapon_type: string
  readonly weapon_rarity: string
}

export const mapInventoryJoinedRowToEntity = (row: InventoryJoinedRow): InventoryItem => ({
  id: row.id as unknown as string,
  playerId: row.player_id,
  weaponId: row.weapon_id,
  weaponKey: row.weapon_key as unknown as string,
  weaponName: row.weapon_name as unknown as string,
  weaponType: row.weapon_type as unknown as string,
  weaponRarity: row.weapon_rarity as unknown as string,
  acquiredAt: row.acquired_at as unknown as Date,
  isPermanent: (row.is_permanent as unknown as boolean | null) ?? true,
  expiresAt: row.expires_at as unknown as Date | null,
})
