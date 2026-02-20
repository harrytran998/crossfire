import type { PlayerLoadouts } from '@crossfire/database'

export type PlayerLoadoutRow = PlayerLoadouts

export interface PlayerLoadout {
  readonly id: string
  readonly playerId: string
  readonly name: string
  readonly slot: number
  readonly isDefault: boolean
  readonly primaryWeaponId: string | null
  readonly secondaryWeaponId: string | null
  readonly meleeWeaponId: string | null
  readonly fragGrenades: number
  readonly flashGrenades: number
  readonly smokeGrenades: number
  readonly primaryAttachments: readonly string[]
  readonly secondaryAttachments: readonly string[]
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface CreateLoadoutInput {
  readonly playerId: string
  readonly name: string
  readonly slot: number
  readonly isDefault?: boolean | undefined
  readonly primaryWeaponId?: string | null | undefined
  readonly secondaryWeaponId?: string | null | undefined
  readonly meleeWeaponId?: string | null | undefined
  readonly fragGrenades?: number | undefined
  readonly flashGrenades?: number | undefined
  readonly smokeGrenades?: number | undefined
  readonly primaryAttachments?: readonly string[] | undefined
  readonly secondaryAttachments?: readonly string[] | undefined
}

export interface UpdateLoadoutInput {
  readonly name?: string | undefined
  readonly slot?: number | undefined
  readonly isDefault?: boolean | undefined
  readonly primaryWeaponId?: string | null | undefined
  readonly secondaryWeaponId?: string | null | undefined
  readonly meleeWeaponId?: string | null | undefined
  readonly fragGrenades?: number | undefined
  readonly flashGrenades?: number | undefined
  readonly smokeGrenades?: number | undefined
  readonly primaryAttachments?: readonly string[] | undefined
  readonly secondaryAttachments?: readonly string[] | undefined
}

export const mapPlayerLoadoutRowToEntity = (row: PlayerLoadoutRow): PlayerLoadout => ({
  id: row.id as unknown as string,
  playerId: row.player_id,
  name: row.name as unknown as string,
  slot: row.slot as unknown as number,
  isDefault: (row.is_default as unknown as boolean | null) ?? false,
  primaryWeaponId: row.primary_weapon_id,
  secondaryWeaponId: row.secondary_weapon_id,
  meleeWeaponId: row.melee_weapon_id,
  fragGrenades: (row.frag_grenades as unknown as number | null) ?? 1,
  flashGrenades: (row.flash_grenades as unknown as number | null) ?? 1,
  smokeGrenades: (row.smoke_grenades as unknown as number | null) ?? 0,
  primaryAttachments: (row.primary_attachments as unknown as readonly string[] | null) ?? [],
  secondaryAttachments: (row.secondary_attachments as unknown as readonly string[] | null) ?? [],
  createdAt: row.created_at as unknown as Date,
  updatedAt: row.updated_at as unknown as Date,
})
