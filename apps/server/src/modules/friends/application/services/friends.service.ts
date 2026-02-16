import { Context, Effect, Layer } from 'effect'
import type { FriendPlayer, FriendRequestLists } from '../../domain/entities/friends.entity'
import {
  FriendRelationNotFoundError,
  FriendRequestConflictError,
  FriendRequestNotFoundError,
  FriendSelfRequestError,
} from '../../domain/errors/friends.errors'
import {
  FriendsRepository as FriendsRepositoryTag,
  FriendsRepositoryLive,
} from '../../infrastructure/repositories/friends.repository.impl'
import {
  PlayerRepository as PlayerRepositoryTag,
  PlayerRepositoryLive,
} from '../../../player/infrastructure/repositories/player.repository.impl'
import { PlayerNotFoundError } from '../../../player/domain/errors/player.errors'

export interface FriendsService {
  readonly sendRequest: (
    userId: string,
    targetPlayerId: string
  ) => Effect.Effect<
    { readonly requestId: string },
    PlayerNotFoundError | FriendSelfRequestError | FriendRequestConflictError
  >
  readonly listRequests: (userId: string) => Effect.Effect<FriendRequestLists, PlayerNotFoundError>
  readonly acceptRequest: (
    userId: string,
    friendshipId: string
  ) => Effect.Effect<void, PlayerNotFoundError | FriendRequestNotFoundError>
  readonly declineRequest: (
    userId: string,
    friendshipId: string
  ) => Effect.Effect<void, PlayerNotFoundError | FriendRequestNotFoundError>
  readonly listFriends: (
    userId: string
  ) => Effect.Effect<readonly FriendPlayer[], PlayerNotFoundError>
  readonly removeFriend: (
    userId: string,
    friendPlayerId: string
  ) => Effect.Effect<void, PlayerNotFoundError | FriendRelationNotFoundError>
}

export const FriendsService = Context.GenericTag<FriendsService>('FriendsService')

export const FriendsServiceLive = Layer.effect(
  FriendsService,
  Effect.gen(function* () {
    const friendsRepo = yield* FriendsRepositoryTag
    const playerRepo = yield* PlayerRepositoryTag

    const getPlayerIdByUserId = (userId: string): Effect.Effect<string, PlayerNotFoundError> =>
      Effect.gen(function* () {
        const player = yield* playerRepo.findByUserId(userId)
        if (!player) {
          return yield* Effect.fail(new PlayerNotFoundError({}))
        }
        return player.id
      })

    const sendRequest: FriendsService['sendRequest'] = (userId, targetPlayerId) =>
      Effect.gen(function* () {
        const requesterId = yield* getPlayerIdByUserId(userId)

        if (requesterId === targetPlayerId) {
          return yield* Effect.fail(new FriendSelfRequestError())
        }

        const target = yield* playerRepo.findById(targetPlayerId)
        if (!target) {
          return yield* Effect.fail(new PlayerNotFoundError({ playerId: targetPlayerId }))
        }

        const existingDirect = yield* friendsRepo.findRelation(requesterId, targetPlayerId)
        if (existingDirect) {
          if (existingDirect.status === 'accepted') {
            return yield* Effect.fail(
              new FriendRequestConflictError({ reason: 'You are already friends with this player' })
            )
          }
          if (existingDirect.status === 'pending') {
            return yield* Effect.fail(
              new FriendRequestConflictError({ reason: 'Friend request already sent' })
            )
          }
        }

        const existingReverse = yield* friendsRepo.findRelation(targetPlayerId, requesterId)
        if (existingReverse) {
          if (existingReverse.status === 'accepted') {
            return yield* Effect.fail(
              new FriendRequestConflictError({ reason: 'You are already friends with this player' })
            )
          }
          if (existingReverse.status === 'pending') {
            return yield* Effect.fail(
              new FriendRequestConflictError({
                reason: 'This player has already sent you a friend request',
              })
            )
          }
        }

        const request = yield* friendsRepo.createOrReopenRequest(requesterId, targetPlayerId)
        return { requestId: request.id }
      })

    const listRequests: FriendsService['listRequests'] = (userId) =>
      Effect.gen(function* () {
        const playerId = yield* getPlayerIdByUserId(userId)
        const incoming = yield* friendsRepo.listIncomingRequests(playerId)
        const outgoing = yield* friendsRepo.listOutgoingRequests(playerId)
        return { incoming, outgoing }
      })

    const acceptRequest: FriendsService['acceptRequest'] = (userId, friendshipId) =>
      Effect.gen(function* () {
        const playerId = yield* getPlayerIdByUserId(userId)
        const accepted = yield* friendsRepo.updateRequestStatusForAddressee(
          friendshipId,
          playerId,
          'accepted'
        )

        if (!accepted) {
          return yield* Effect.fail(new FriendRequestNotFoundError())
        }
      })

    const declineRequest: FriendsService['declineRequest'] = (userId, friendshipId) =>
      Effect.gen(function* () {
        const playerId = yield* getPlayerIdByUserId(userId)
        const declined = yield* friendsRepo.updateRequestStatusForAddressee(
          friendshipId,
          playerId,
          'declined'
        )

        if (!declined) {
          return yield* Effect.fail(new FriendRequestNotFoundError())
        }
      })

    const listFriends: FriendsService['listFriends'] = (userId) =>
      Effect.gen(function* () {
        const playerId = yield* getPlayerIdByUserId(userId)
        return yield* friendsRepo.listFriends(playerId)
      })

    const removeFriend: FriendsService['removeFriend'] = (userId, friendPlayerId) =>
      Effect.gen(function* () {
        const playerId = yield* getPlayerIdByUserId(userId)
        const removed = yield* friendsRepo.removeFriendRelation(playerId, friendPlayerId)

        if (!removed) {
          return yield* Effect.fail(new FriendRelationNotFoundError())
        }
      })

    return FriendsService.of({
      sendRequest,
      listRequests,
      acceptRequest,
      declineRequest,
      listFriends,
      removeFriend,
    })
  })
).pipe(Layer.provide(FriendsRepositoryLive), Layer.provide(PlayerRepositoryLive))
