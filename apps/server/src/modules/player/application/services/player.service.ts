import { Context, Effect, Layer } from 'effect'
import type {
  CreatePlayerInput,
  Player,
  PlayerProgression,
  PlayerStats,
  UpdatePlayerInput,
} from '../../domain/entities/player.entity'
import { PlayerAlreadyExistsError, PlayerNotFoundError } from '../../domain/errors/player.errors'
import {
  PlayerRepository as PlayerRepositoryTag,
  PlayerRepositoryLive,
} from '../../infrastructure/repositories/player.repository.impl'

export interface PlayerService {
  readonly createProfile: (
    input: CreatePlayerInput
  ) => Effect.Effect<Player, PlayerAlreadyExistsError>
  readonly getProfileByUserId: (userId: string) => Effect.Effect<Player, PlayerNotFoundError>
  readonly updateProfile: (
    userId: string,
    input: UpdatePlayerInput
  ) => Effect.Effect<Player, PlayerNotFoundError>
  readonly getStatsByUserId: (userId: string) => Effect.Effect<PlayerStats, PlayerNotFoundError>
  readonly getProgressionByUserId: (
    userId: string
  ) => Effect.Effect<PlayerProgression, PlayerNotFoundError>
}

export const PlayerService = Context.GenericTag<PlayerService>('PlayerService')

export const PlayerServiceLive = Layer.effect(
  PlayerService,
  Effect.gen(function* () {
    const repo = yield* PlayerRepositoryTag

    const getProfileByUserId = (userId: string): Effect.Effect<Player, PlayerNotFoundError> =>
      Effect.gen(function* () {
        const player = yield* repo.findByUserId(userId)
        if (!player) {
          return yield* Effect.fail(new PlayerNotFoundError({}))
        }
        return player
      })

    const createProfile = (
      input: CreatePlayerInput
    ): Effect.Effect<Player, PlayerAlreadyExistsError> =>
      Effect.gen(function* () {
        const player = yield* repo.create(input)
        yield* repo.createStats(player.id)
        yield* repo.createProgression(player.id)
        return player
      })

    const updateProfile = (
      userId: string,
      input: UpdatePlayerInput
    ): Effect.Effect<Player, PlayerNotFoundError> =>
      Effect.gen(function* () {
        const player = yield* getProfileByUserId(userId)
        return yield* repo.update(player.id, input)
      })

    const getStatsByUserId = (userId: string): Effect.Effect<PlayerStats, PlayerNotFoundError> =>
      Effect.gen(function* () {
        const player = yield* getProfileByUserId(userId)
        const stats = yield* repo.getStats(player.id)
        if (stats) {
          return stats
        }
        return yield* repo.createStats(player.id)
      })

    const getProgressionByUserId = (
      userId: string
    ): Effect.Effect<PlayerProgression, PlayerNotFoundError> =>
      Effect.gen(function* () {
        const player = yield* getProfileByUserId(userId)
        const progression = yield* repo.getProgression(player.id)
        if (progression) {
          return progression
        }
        return yield* repo.createProgression(player.id)
      })

    return PlayerService.of({
      createProfile,
      getProfileByUserId,
      updateProfile,
      getStatsByUserId,
      getProgressionByUserId,
    })
  })
).pipe(Layer.provide(PlayerRepositoryLive))
