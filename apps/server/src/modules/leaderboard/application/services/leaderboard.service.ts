import { Context, Effect, Layer } from 'effect'
import type { GameMode, LeaderboardPeriod } from '@crossfire/database'
import type { LeaderboardResult } from '../../domain/entities/leaderboard.entity'
import {
  LeaderboardRepository as LeaderboardRepositoryTag,
  LeaderboardRepositoryLive,
} from '../../infrastructure/repositories/leaderboard.repository.impl'
import {
  PlayerRepository as PlayerRepositoryTag,
  PlayerRepositoryLive,
} from '../../../player/infrastructure/repositories/player.repository.impl'
import { PlayerNotFoundError } from '../../../player/domain/errors/player.errors'

export interface LeaderboardService {
  readonly getForUser: (
    userId: string,
    options: {
      readonly metricKey?: string
      readonly period?: LeaderboardPeriod
      readonly mode?: GameMode
      readonly page: number
      readonly pageSize: number
      readonly includeCurrentPlayerRank: boolean
    }
  ) => Effect.Effect<readonly LeaderboardResult[], PlayerNotFoundError>
}

export const LeaderboardService = Context.GenericTag<LeaderboardService>('LeaderboardService')

export const LeaderboardServiceLive = Layer.effect(
  LeaderboardService,
  Effect.gen(function* () {
    const leaderboardRepo = yield* LeaderboardRepositoryTag
    const playerRepo = yield* PlayerRepositoryTag

    const getForUser: LeaderboardService['getForUser'] = (userId, options) =>
      Effect.gen(function* () {
        const player = yield* playerRepo.findByUserId(userId)
        if (!player) {
          return yield* Effect.fail(new PlayerNotFoundError({}))
        }

        return yield* leaderboardRepo.getLeaderboard(
          player.id,
          {
            metricKey: options.metricKey,
            period: options.period,
            mode: options.mode,
          },
          options.page,
          options.pageSize,
          options.includeCurrentPlayerRank
        )
      })

    return LeaderboardService.of({
      getForUser,
    })
  })
).pipe(Layer.provide(LeaderboardRepositoryLive), Layer.provide(PlayerRepositoryLive))
