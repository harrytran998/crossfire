import { describe, expect, test } from 'bun:test'
import { Effect, Layer } from 'effect'
import {
  AuthService,
  AuthServiceLive,
} from '../../src/modules/auth/application/services/auth.service'
import {
  LeaderboardService,
  LeaderboardServiceLive,
} from '../../src/modules/leaderboard/application/services/leaderboard.service'
import {
  MatchService,
  MatchServiceLive,
} from '../../src/modules/match/application/services/match.service'
import {
  PlayerService,
  PlayerServiceLive,
} from '../../src/modules/player/application/services/player.service'
import { ConfigLayer } from '../../src/layers'
import { DatabaseServiceLive } from '../../src/services/database.service'
import { RedisServiceLive } from '../../src/services/redis.service'

describe('Match + Leaderboard services', () => {
  const BaseLayer = Layer.mergeAll(
    ConfigLayer,
    DatabaseServiceLive,
    Layer.provide(RedisServiceLive, ConfigLayer)
  )
  const TestLayer = Layer.mergeAll(
    Layer.provide(AuthServiceLive, BaseLayer),
    Layer.provide(PlayerServiceLive, BaseLayer),
    Layer.provide(MatchServiceLive, BaseLayer),
    Layer.provide(LeaderboardServiceLive, BaseLayer)
  )

  const runTest = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Effect.runPromise(Effect.provide(effect, TestLayer) as Effect.Effect<A, E, never>)

  test('should return paginated match list and leaderboard list', async () => {
    const result = await runTest(
      Effect.gen(function* () {
        const auth = yield* AuthService
        const playerService = yield* PlayerService
        const matchService = yield* MatchService
        const leaderboardService = yield* LeaderboardService

        const id = `${Date.now()}${Math.floor(Math.random() * 100000)}`
        const user = yield* auth.register({
          email: `ml-${id}@example.com`,
          username: `ml_${id}`,
          password: 'TestPassword123!',
        })

        yield* playerService.createProfile({
          userId: user.user.id,
          displayName: 'Stats Tester',
        })

        const matches = yield* matchService.listByUserId(user.user.id, 1, 20)
        const leaderboards = yield* leaderboardService.getForUser(user.user.id, {
          page: 1,
          pageSize: 10,
          includeCurrentPlayerRank: true,
        })

        return { matches, leaderboards }
      })
    )

    expect(result.matches.page).toBe(1)
    expect(Array.isArray(result.matches.items)).toBe(true)
    expect(Array.isArray(result.leaderboards)).toBe(true)
  })
})
