import type { Friendships } from '@crossfire/database'

export type FriendshipRow = Friendships
export type FriendshipStatus = 'pending' | 'accepted' | 'declined'

export interface FriendRequest {
  readonly id: string
  readonly requesterId: string
  readonly addresseeId: string
  readonly status: FriendshipStatus
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface FriendPlayer {
  readonly playerId: string
  readonly displayName: string
  readonly friendshipId: string
  readonly since: Date
}

export interface FriendRequestLists {
  readonly incoming: readonly FriendRequest[]
  readonly outgoing: readonly FriendRequest[]
}

export const mapFriendshipRowToEntity = (row: FriendshipRow): FriendRequest => ({
  id: row.id as unknown as string,
  requesterId: row.requester_id,
  addresseeId: row.addressee_id,
  status: row.status as unknown as FriendshipStatus,
  createdAt: row.created_at as unknown as Date,
  updatedAt: row.updated_at as unknown as Date,
})
