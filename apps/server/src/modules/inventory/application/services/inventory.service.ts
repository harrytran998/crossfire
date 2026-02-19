import { Context, Effect, Layer } from 'effect'
import type { InventoryItem } from '../../domain/entities/inventory.entity'
import { InventoryWeaponNotFoundError } from '../../domain/errors/inventory.errors'
import {
  InventoryRepository as InventoryRepositoryTag,
  InventoryRepositoryLive,
} from '../../infrastructure/repositories/inventory.repository.impl'
import {
  PlayerRepository as PlayerRepositoryTag,
  PlayerRepositoryLive,
} from '../../../player/infrastructure/repositories/player.repository.impl'
import { PlayerNotFoundError } from '../../../player/domain/errors/player.errors'

export interface InventoryService {
  readonly listByUserId: (
    userId: string
  ) => Effect.Effect<readonly InventoryItem[], PlayerNotFoundError>
  readonly acquireForUser: (
    userId: string,
    input: {
      readonly weaponId: string
      readonly isPermanent?: boolean
      readonly expiresAt?: Date | null
    }
  ) => Effect.Effect<InventoryItem, PlayerNotFoundError | InventoryWeaponNotFoundError>
}

export const InventoryService = Context.GenericTag<InventoryService>('InventoryService')

export const InventoryServiceLive = Layer.effect(
  InventoryService,
  Effect.gen(function* () {
    const inventoryRepo = yield* InventoryRepositoryTag
    const playerRepo = yield* PlayerRepositoryTag

    const getPlayerIdByUserId = (userId: string): Effect.Effect<string, PlayerNotFoundError> =>
      Effect.gen(function* () {
        const player = yield* playerRepo.findByUserId(userId)
        if (!player) {
          return yield* Effect.fail(new PlayerNotFoundError({}))
        }
        return player.id
      })

    const listByUserId = (
      userId: string
    ): Effect.Effect<readonly InventoryItem[], PlayerNotFoundError> =>
      Effect.gen(function* () {
        const playerId = yield* getPlayerIdByUserId(userId)
        return yield* inventoryRepo.listByPlayerId(playerId)
      })

    const acquireForUser = (
      userId: string,
      input: {
        readonly weaponId: string
        readonly isPermanent?: boolean
        readonly expiresAt?: Date | null
      }
    ): Effect.Effect<InventoryItem, PlayerNotFoundError | InventoryWeaponNotFoundError> =>
      Effect.gen(function* () {
        const playerId = yield* getPlayerIdByUserId(userId)
        return yield* inventoryRepo.acquireWeapon({
          playerId,
          weaponId: input.weaponId,
          isPermanent: input.isPermanent,
          expiresAt: input.expiresAt,
        })
      })

    return InventoryService.of({
      listByUserId,
      acquireForUser,
    })
  })
).pipe(Layer.provide(InventoryRepositoryLive), Layer.provide(PlayerRepositoryLive))
