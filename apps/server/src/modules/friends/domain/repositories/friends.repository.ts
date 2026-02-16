import type { Effect } from 'effect'
import type { FriendPlayer, FriendRequest, FriendshipStatus } from '../entities/friends.entity'

export interface FriendsRepository {
  readonly findRelation: (
    requesterId: string,
    addresseeId: string
  ) => Effect.Effect<FriendRequest | null>
  readonly createOrReopenRequest: (
    requesterId: string,
    addresseeId: string
  ) => Effect.Effect<FriendRequest>
  readonly listIncomingRequests: (playerId: string) => Effect.Effect<readonly FriendRequest[]>
  readonly listOutgoingRequests: (playerId: string) => Effect.Effect<readonly FriendRequest[]>
  readonly updateRequestStatusForAddressee: (
    friendshipId: string,
    addresseeId: string,
    status: FriendshipStatus
  ) => Effect.Effect<FriendRequest | null>
  readonly listFriends: (playerId: string) => Effect.Effect<readonly FriendPlayer[]>
  readonly removeFriendRelation: (playerId: string, friendPlayerId: string) => Effect.Effect<boolean>
}
