import { Context, Effect, Layer } from 'effect'
import type { MatchDetail, MatchPage } from '../../domain/entities/match.entity'
import { MatchNotFoundError } from '../../domain/errors/match.errors'
import {
  MatchRepository as MatchRepositoryTag,
  MatchRepositoryLive,
} from '../../infrastructure/repositories/match.repository.impl'
import {
  PlayerRepository as PlayerRepositoryTag,
  PlayerRepositoryLive,
} from '../../../player/infrastructure/repositories/player.repository.impl'
import { PlayerNotFoundError } from '../../../player/domain/errors/player.errors'

export interface MatchService {
  readonly listByUserId: (
    userId: string,
    page: number,
    pageSize: number
  ) => Effect.Effect<MatchPage, PlayerNotFoundError>
  readonly getDetailByUserId: (
    userId: string,
    matchId: string
  ) => Effect.Effect<MatchDetail, PlayerNotFoundError | MatchNotFoundError>
}

export const MatchService = Context.GenericTag<MatchService>('MatchService')

export const MatchServiceLive = Layer.effect(
  MatchService,
  Effect.gen(function* () {
    const matchRepo = yield* MatchRepositoryTag
    const playerRepo = yield* PlayerRepositoryTag

    const getPlayerIdByUserId = (userId: string): Effect.Effect<string, PlayerNotFoundError> =>
      Effect.gen(function* () {
        const player = yield* playerRepo.findByUserId(userId)
        if (!player) {
          return yield* Effect.fail(new PlayerNotFoundError({}))
        }
        return player.id
      })

    const listByUserId: MatchService['listByUserId'] = (userId, page, pageSize) =>
      Effect.gen(function* () {
        const playerId = yield* getPlayerIdByUserId(userId)
        return yield* matchRepo.listByPlayerId(playerId, page, pageSize)
      })

    const getDetailByUserId: MatchService['getDetailByUserId'] = (userId, matchId) =>
      Effect.gen(function* () {
        const playerId = yield* getPlayerIdByUserId(userId)
        const detail = yield* matchRepo.getDetailByPlayerId(playerId, matchId)
        if (!detail) {
          return yield* Effect.fail(new MatchNotFoundError({ matchId }))
        }
        return detail
      })

    return MatchService.of({
      listByUserId,
      getDetailByUserId,
    })
  })
).pipe(Layer.provide(MatchRepositoryLive), Layer.provide(PlayerRepositoryLive))
