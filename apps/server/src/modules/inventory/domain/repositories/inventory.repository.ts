import type { Effect } from 'effect'
import type { AcquireInventoryInput, InventoryItem } from '../entities/inventory.entity'
import type { InventoryWeaponNotFoundError } from '../errors/inventory.errors'

export interface InventoryRepository {
  readonly listByPlayerId: (playerId: string) => Effect.Effect<readonly InventoryItem[]>
  readonly acquireWeapon: (
    input: AcquireInventoryInput
  ) => Effect.Effect<InventoryItem, InventoryWeaponNotFoundError>
  readonly hasInventoryItem: (playerId: string, inventoryId: string) => Effect.Effect<boolean>
}
