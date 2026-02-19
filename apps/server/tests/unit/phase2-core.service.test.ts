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
import {
  InventoryService,
  InventoryServiceLive,
} from '../../src/modules/inventory/application/services/inventory.service'
import {
  LoadoutService,
  LoadoutServiceLive,
} from '../../src/modules/loadout/application/services/loadout.service'
import {
  MatchService,
  MatchServiceLive,
} from '../../src/modules/match/application/services/match.service'
import {
  LeaderboardService,
  LeaderboardServiceLive,
} from '../../src/modules/leaderboard/application/services/leaderboard.service'
import {
  FriendsService,
  FriendsServiceLive,
} from '../../src/modules/friends/application/services/friends.service'
import { ConfigLayer } from '../../src/layers/index'
import { DatabaseService, DatabaseServiceLive } from '../../src/services/database.service'

describe('Phase 2 Core Services', () => {
  const BaseLayer = Layer.mergeAll(ConfigLayer, DatabaseServiceLive)
  const TestLayer = Layer.mergeAll(
    BaseLayer,
    Layer.provide(AuthServiceLive, BaseLayer),
    Layer.provide(PlayerServiceLive, BaseLayer),
    Layer.provide(InventoryServiceLive, BaseLayer),
    Layer.provide(LoadoutServiceLive, BaseLayer),
    Layer.provide(MatchServiceLive, BaseLayer),
    Layer.provide(LeaderboardServiceLive, BaseLayer),
    Layer.provide(FriendsServiceLive, BaseLayer)
  )

  const runTest = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Effect.runPromise(Effect.provide(effect, TestLayer) as Effect.Effect<A, E, never>)

  const createIdentity = (prefix: string) => {
    const id = `${Date.now()}${Math.floor(Math.random() * 100000)}`
    return {
      email: `${prefix}-${id}@example.com`,
      username: `${prefix}_${id}`,
      password: 'TestPassword123!',
    }
  }

  test('inventory + loadout services should support acquisition and CRUD', async () => {
    const result = await runTest(
      Effect.gen(function* () {
        const auth = yield* AuthService
        const players = yield* PlayerService
        const inventory = yield* InventoryService
        const loadouts = yield* LoadoutService
        const { db } = yield* DatabaseService

        const identity = createIdentity('phase2-inv')
        const registered = yield* auth.register(identity)
        const player = yield* players.createProfile({
          userId: registered.user.id,
          displayName: 'Phase2 Inv User',
        })

        const weapon = yield* Effect.promise(async () => {
          const existing = await db
            .selectFrom('weapons')
            .select(['id'])
            .orderBy('name', 'asc')
            .executeTakeFirst()

          if (existing) {
            return existing
          }

          const key = `test_weapon_${Date.now()}_${Math.floor(Math.random() * 1000)}`
          return db
            .insertInto('weapons')
            .values({
              weapon_key: key,
              name: 'Unit Test Weapon',
              weapon_type: 'assault_rifle',
              rarity: 'common',
              base_damage: 30,
              unlock_level: 1,
              unlock_cost: 0,
              is_active: true,
            })
            .returning(['id'])
            .executeTakeFirstOrThrow()
        })

        const firstItem = yield* inventory.acquireForUser(registered.user.id, {
          weaponId: weapon.id as unknown as string,
        })
        const secondItem = yield* inventory.acquireForUser(registered.user.id, {
          weaponId: weapon.id as unknown as string,
        })

        const listedInventory = yield* inventory.listByUserId(registered.user.id)

        const createdLoadout = yield* loadouts.createForUser(registered.user.id, {
          name: 'Assault',
          slot: 1,
          primaryWeaponId: firstItem.id,
        })

        const updatedLoadout = yield* loadouts.updateForUser(
          registered.user.id,
          createdLoadout.id,
          {
            name: 'Assault Updated',
          }
        )

        const listedLoadouts = yield* loadouts.listByUserId(registered.user.id)
        yield* loadouts.removeForUser(registered.user.id, createdLoadout.id)

        return {
          playerId: player.id,
          firstItem,
          secondItem,
          listedInventory,
          updatedLoadout,
          listedLoadouts,
        }
      })
    )

    expect(result.firstItem.weaponId).toBe(result.secondItem.weaponId)
    expect(result.listedInventory.length).toBeGreaterThan(0)
    expect(result.updatedLoadout.name).toBe('Assault Updated')
    expect(result.listedLoadouts.length).toBeGreaterThan(0)
  })

  test('match + leaderboard services should return player scoped records', async () => {
    const result = await runTest(
      Effect.gen(function* () {
        const auth = yield* AuthService
        const players = yield* PlayerService
        const matches = yield* MatchService
        const leaderboards = yield* LeaderboardService
        const { db } = yield* DatabaseService

        const identity = createIdentity('phase2-ml')
        const registered = yield* auth.register(identity)
        const player = yield* players.createProfile({
          userId: registered.user.id,
          displayName: 'Phase2 Match User',
        })

        const map = yield* Effect.promise(async () => {
          return db
            .selectFrom('maps')
            .select(['id'])
            .orderBy('name', 'asc')
            .executeTakeFirstOrThrow()
        })

        const match = yield* Effect.promise(async () => {
          return db
            .insertInto('matches')
            .values({
              game_mode: 'team_deathmatch',
              map_id: map.id as unknown as string,
              duration_seconds: 640,
              started_at: new Date(Date.now() - 10 * 60 * 1000),
              completed_at: new Date(),
              winning_team: 1,
            })
            .returning(['id'])
            .executeTakeFirstOrThrow()
        })

        yield* Effect.promise(async () => {
          await db
            .insertInto('match_participants')
            .values({
              match_id: match.id as unknown as string,
              player_id: player.id,
              team: 1,
              score: 30,
              kills: 12,
              deaths: 4,
              assists: 5,
              is_winner: true,
              headshots: 4,
              damage_dealt: 1800,
              damage_received: 700,
              xp_gained: 210,
            })
            .execute()
        })

        const leaderboard = yield* Effect.promise(async () => {
          return db
            .insertInto('leaderboards')
            .values({
              name: `KD Board ${Date.now()}`,
              metric_key: 'kills',
              period_type: 'weekly',
              game_mode: 'team_deathmatch',
            })
            .returning(['id'])
            .executeTakeFirstOrThrow()
        })

        yield* Effect.promise(async () => {
          await db
            .insertInto('leaderboard_entries')
            .values({
              leaderboard_id: leaderboard.id as unknown as string,
              player_id: player.id,
              rank: 1,
              metric_value: 99,
              matches_count: 12,
              period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              period_end: new Date(),
            })
            .execute()
        })

        const matchPage = yield* matches.listByUserId(registered.user.id, 1, 20)
        const matchDetail = yield* matches.getDetailByUserId(registered.user.id, match.id as string)
        const boards = yield* leaderboards.getForUser(registered.user.id, {
          metricKey: 'kills',
          period: 'weekly',
          mode: 'team_deathmatch',
          page: 1,
          pageSize: 10,
          includeCurrentPlayerRank: true,
        })

        return { matchPage, matchDetail, boards }
      })
    )

    expect(result.matchPage.items.length).toBeGreaterThan(0)
    expect(result.matchDetail.participants.length).toBeGreaterThan(0)
    expect(result.boards.length).toBeGreaterThan(0)
    expect(result.boards[0]?.playerRank?.rank).toBe(1)
  })

  test('friends service should handle request lifecycle', async () => {
    const result = await runTest(
      Effect.gen(function* () {
        const auth = yield* AuthService
        const players = yield* PlayerService
        const friends = yield* FriendsService

        const firstIdentity = createIdentity('phase2-f1')
        const secondIdentity = createIdentity('phase2-f2')

        const first = yield* auth.register(firstIdentity)
        const second = yield* auth.register(secondIdentity)

        yield* players.createProfile({ userId: first.user.id, displayName: 'Friend One' })
        const secondPlayer = yield* players.createProfile({
          userId: second.user.id,
          displayName: 'Friend Two',
        })

        const request = yield* friends.sendRequest(first.user.id, secondPlayer.id)
        const requestsForSecond = yield* friends.listRequests(second.user.id)
        yield* friends.acceptRequest(second.user.id, request.requestId)

        const firstFriends = yield* friends.listFriends(first.user.id)
        yield* friends.removeFriend(first.user.id, secondPlayer.id)

        return { requestsForSecond, firstFriends }
      })
    )

    expect(result.requestsForSecond.incoming.length).toBeGreaterThan(0)
    expect(result.firstFriends.length).toBeGreaterThan(0)
  })
})
