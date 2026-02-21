import { Data } from 'effect'

export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'closed'

export interface RoomPlayer {
  readonly playerId: string
  readonly username: string
  readonly isReady: boolean
  readonly isHost: boolean
  readonly joinedAt: number
}

export interface Room {
  readonly id: string
  readonly name: string
  readonly hostId: string
  readonly status: RoomStatus
  readonly maxPlayers: number
  readonly gameMode: string
  readonly mapId?: string
  readonly isPublic: boolean
  readonly players: RoomPlayer[]
  readonly createdAt: number
  readonly updatedAt: number
}

export class RoomError extends Data.TaggedError('RoomError') {
  constructor(
    readonly reason: string,
    readonly code: RoomErrorCode
  ) {
    super()
  }
}

export type RoomErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ALREADY_IN_ROOM'
  | 'NOT_IN_ROOM'
  | 'NOT_HOST'
  | 'INVALID_STATUS'
  | 'PLAYER_NOT_FOUND'
  | 'CANNOT_KICK_HOST'
  | 'GAME_ALREADY_STARTED'

export interface CreateRoomOptions {
  readonly name: string
  readonly hostId: string
  readonly hostUsername: string
  readonly maxPlayers: number
  readonly gameMode: string
  readonly mapId?: string
  readonly isPublic: boolean
}
