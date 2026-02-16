import { describe, expect, test } from 'bun:test'
import { Effect, Layer } from 'effect'
import {
  AuthService,
  AuthServiceLive,
} from '../../src/modules/auth/application/services/auth.service'
import {
  FriendsService,
  FriendsServiceLive,
} from '../../src/modules/friends/application/services/friends.service'
import {
  PlayerService,
  PlayerServiceLive,
} from '../../src/modules/player/application/services/player.service'
import { ConfigLayer } from '../../src/layers'
import { DatabaseServiceLive } from '../../src/services/database.service'

describe('FriendService', () => {
  const BaseLayer = Layer.mergeAll(ConfigLayer, DatabaseServiceLive)
  const TestLayer = Layer.mergeAll(
    Layer.provide(AuthServiceLive, BaseLayer),
    Layer.provide(PlayerServiceLive, BaseLayer),
    Layer.provide(FriendsServiceLive, BaseLayer)
  )

  const runTest = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Effect.runPromise(Effect.provide(effect, TestLayer) as Effect.Effect<A, E, never>)

  test('should send and accept friend request', async () => {
    const result = await runTest(
      Effect.gen(function* () {
        const auth = yield* AuthService
        const playerService = yield* PlayerService
        const friendService = yield* FriendsService

        const id = `${Date.now()}${Math.floor(Math.random() * 100000)}`
        const userA = yield* auth.register({
          email: `friend-a-${id}@example.com`,
          username: `friend_a_${id}`,
          password: 'TestPassword123!',
        })
        const userB = yield* auth.register({
          email: `friend-b-${id}@example.com`,
          username: `friend_b_${id}`,
          password: 'TestPassword123!',
        })

        const playerA = yield* playerService.createProfile({
          userId: userA.user.id,
          displayName: 'Friend A',
        })
        const playerB = yield* playerService.createProfile({
          userId: userB.user.id,
          displayName: 'Friend B',
        })

        const request = yield* friendService.sendRequest(userA.user.id, playerB.id)
        const incoming = yield* friendService.listRequests(userB.user.id)

        yield* friendService.acceptRequest(userB.user.id, request.requestId)

        const friendsA = yield* friendService.listFriends(userA.user.id)
        const friendsB = yield* friendService.listFriends(userB.user.id)

        return { playerA, playerB, incoming, friendsA, friendsB }
      })
    )

    expect(result.incoming.incoming.length).toBeGreaterThanOrEqual(1)
    expect(result.friendsA.some((friend) => friend.playerId === result.playerB.id)).toBe(true)
    expect(result.friendsB.some((friend) => friend.playerId === result.playerA.id)).toBe(true)
  })
})
