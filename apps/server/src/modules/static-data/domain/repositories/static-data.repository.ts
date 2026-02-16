import type { Effect } from 'effect'
import type { GameMap, Weapon, WeaponAttachment } from '../entities/static-data.entity'

export interface StaticDataRepository {
  readonly getActiveWeapons: () => Effect.Effect<readonly Weapon[]>
  readonly getWeaponByKey: (weaponKey: string) => Effect.Effect<Weapon | null>
  readonly getWeaponAttachments: (weaponId: string) => Effect.Effect<readonly WeaponAttachment[]>
  readonly getActiveMaps: () => Effect.Effect<readonly GameMap[]>
}
