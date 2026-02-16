import { Context, Effect, Layer } from 'effect'
import type {
  CreateLoadoutInput,
  PlayerLoadout,
  UpdateLoadoutInput,
} from '../../domain/entities/loadout.entity'
import {
  LoadoutItemOwnershipError,
  LoadoutNotFoundError,
  LoadoutSlotTakenError,
} from '../../domain/errors/loadout.errors'
import {
  LoadoutRepository as LoadoutRepositoryTag,
  LoadoutRepositoryLive,
} from '../../infrastructure/repositories/loadout.repository.impl'
import {
  PlayerRepository as PlayerRepositoryTag,
  PlayerRepositoryLive,
} from '../../../player/infrastructure/repositories/player.repository.impl'
import { PlayerNotFoundError } from '../../../player/domain/errors/player.errors'
import {
  InventoryRepository as InventoryRepositoryTag,
  InventoryRepositoryLive,
} from '../../../inventory/infrastructure/repositories/inventory.repository.impl'

export interface LoadoutService {
  readonly listByUserId: (userId: string) => Effect.Effect<readonly PlayerLoadout[], PlayerNotFoundError>
  readonly createForUser: (
    userId: string,
    input: Omit<CreateLoadoutInput, 'playerId'>
  ) => Effect.Effect<
    PlayerLoadout,
    PlayerNotFoundError | LoadoutSlotTakenError | LoadoutItemOwnershipError
  >
  readonly updateForUser: (
    userId: string,
    loadoutId: string,
    input: UpdateLoadoutInput
  ) => Effect.Effect<
    PlayerLoadout,
    PlayerNotFoundError | LoadoutNotFoundError | LoadoutSlotTakenError | LoadoutItemOwnershipError
  >
  readonly removeForUser: (
    userId: string,
    loadoutId: string
  ) => Effect.Effect<void, PlayerNotFoundError | LoadoutNotFoundError>
}

export const LoadoutService = Context.GenericTag<LoadoutService>('LoadoutService')

export const LoadoutServiceLive = Layer.effect(
  LoadoutService,
  Effect.gen(function* () {
    const loadoutRepo = yield* LoadoutRepositoryTag
    const playerRepo = yield* PlayerRepositoryTag
    const inventoryRepo = yield* InventoryRepositoryTag

    const getPlayerIdByUserId = (userId: string): Effect.Effect<string, PlayerNotFoundError> =>
      Effect.gen(function* () {
        const player = yield* playerRepo.findByUserId(userId)
        if (!player) {
          return yield* Effect.fail(new PlayerNotFoundError({}))
        }
        return player.id
      })

    const ensureOwnership = (
      playerId: string,
      inventoryId: string | null | undefined
    ): Effect.Effect<void, LoadoutItemOwnershipError> =>
      Effect.gen(function* () {
        if (!inventoryId) {
          return
        }

        const owned = yield* inventoryRepo.hasInventoryItem(playerId, inventoryId)
        if (!owned) {
          return yield* Effect.fail(new LoadoutItemOwnershipError({ inventoryId }))
        }
      })

    const listByUserId = (userId: string): Effect.Effect<readonly PlayerLoadout[], PlayerNotFoundError> =>
      Effect.gen(function* () {
        const playerId = yield* getPlayerIdByUserId(userId)
        return yield* loadoutRepo.listByPlayerId(playerId)
      })

    const createForUser = (
      userId: string,
      input: Omit<CreateLoadoutInput, 'playerId'>
    ): Effect.Effect<
      PlayerLoadout,
      PlayerNotFoundError | LoadoutSlotTakenError | LoadoutItemOwnershipError
    > =>
      Effect.gen(function* () {
        const playerId = yield* getPlayerIdByUserId(userId)

        yield* ensureOwnership(playerId, input.primaryWeaponId)
        yield* ensureOwnership(playerId, input.secondaryWeaponId)
        yield* ensureOwnership(playerId, input.meleeWeaponId)

        return yield* loadoutRepo.create({
          ...input,
          playerId,
        })
      })

    const updateForUser = (
      userId: string,
      loadoutId: string,
      input: UpdateLoadoutInput
    ): Effect.Effect<
      PlayerLoadout,
      PlayerNotFoundError | LoadoutNotFoundError | LoadoutSlotTakenError | LoadoutItemOwnershipError
    > =>
      Effect.gen(function* () {
        const playerId = yield* getPlayerIdByUserId(userId)

        const existing = yield* loadoutRepo.findById(loadoutId)
        if (!existing || existing.playerId !== playerId) {
          return yield* Effect.fail(new LoadoutNotFoundError({ loadoutId }))
        }

        yield* ensureOwnership(playerId, input.primaryWeaponId)
        yield* ensureOwnership(playerId, input.secondaryWeaponId)
        yield* ensureOwnership(playerId, input.meleeWeaponId)

        return yield* loadoutRepo.update(loadoutId, input)
      })

    const removeForUser = (
      userId: string,
      loadoutId: string
    ): Effect.Effect<void, PlayerNotFoundError | LoadoutNotFoundError> =>
      Effect.gen(function* () {
        const playerId = yield* getPlayerIdByUserId(userId)
        const existing = yield* loadoutRepo.findById(loadoutId)

        if (!existing || existing.playerId !== playerId) {
          return yield* Effect.fail(new LoadoutNotFoundError({ loadoutId }))
        }

        return yield* loadoutRepo.remove(loadoutId)
      })

    return LoadoutService.of({
      listByUserId,
      createForUser,
      updateForUser,
      removeForUser,
    })
  })
).pipe(
  Layer.provide(LoadoutRepositoryLive),
  Layer.provide(PlayerRepositoryLive),
  Layer.provide(InventoryRepositoryLive)
)
