import { describe, expect, test } from 'bun:test'
import { Effect, Layer } from 'effect'
import {
  AuthService,
  AuthServiceLive,
} from '../../src/modules/auth/application/services/auth.service'
import {
  PlayerService,
  PlayerServiceLive,
} from '../../src/modules/player/application/services/player.service'
import { ConfigLayer } from '../../src/layers/index'
import { DatabaseServiceLive } from '../../src/services/database.service'

describe('PlayerService', () => {
  const BaseLayer = Layer.mergeAll(ConfigLayer, DatabaseServiceLive)
  const TestLayer = Layer.mergeAll(
    Layer.provide(AuthServiceLive, BaseLayer),
    Layer.provide(PlayerServiceLive, BaseLayer)
  )

  const runTest = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Effect.runPromise(Effect.provide(effect, TestLayer) as Effect.Effect<A, E, never>)

  const identity = {
    email: `player-${Date.now()}@example.com`,
    username: `playeruser-${Date.now()}`,
    password: 'TestPassword123!',
  }

  test('should create and retrieve player profile with stats/progression', async () => {
    const result = await runTest(
      Effect.gen(function* () {
        const auth = yield* AuthService
        const playerService = yield* PlayerService

        const registered = yield* auth.register(identity)
        const player = yield* playerService.createProfile({
          userId: registered.user.id,
          displayName: 'Player One',
          region: 'ASIA',
          language: 'en',
        })

        const stats = yield* playerService.getStatsByUserId(registered.user.id)
        const progression = yield* playerService.getProgressionByUserId(registered.user.id)

        return { player, stats, progression }
      })
    )

    expect(result.player.displayName).toBe('Player One')
    expect(result.stats.playerId).toBe(result.player.id)
    expect(result.progression.playerId).toBe(result.player.id)
    expect(result.progression.currentLevel).toBeGreaterThanOrEqual(1)
  })

  test('should update player profile', async () => {
    const updated = await runTest(
      Effect.gen(function* () {
        const auth = yield* AuthService
        const playerService = yield* PlayerService

        const user = yield* auth.register({
          email: `player-update-${Date.now()}@example.com`,
          username: `playerupdate-${Date.now()}`,
          password: 'TestPassword123!',
        })

        yield* playerService.createProfile({
          userId: user.user.id,
          displayName: 'Initial Name',
        })

        return yield* playerService.updateProfile(user.user.id, {
          displayName: 'Updated Name',
          bio: 'Competitive player',
        })
      })
    )

    expect(updated.displayName).toBe('Updated Name')
    expect(updated.bio).toBe('Competitive player')
  })
})
