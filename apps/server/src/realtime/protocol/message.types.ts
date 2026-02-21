export const MessageType = {
  AUTH: 'AUTH',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  PING: 'PING',
  PONG: 'PONG',
  ERROR: 'ERROR',
  
  ROOM_CREATE: 'ROOM_CREATE',
  ROOM_CREATED: 'ROOM_CREATED',
  ROOM_JOIN: 'ROOM_JOIN',
  ROOM_JOINED: 'ROOM_JOINED',
  ROOM_LEAVE: 'ROOM_LEAVE',
  ROOM_LEFT: 'ROOM_LEFT',
  ROOM_UPDATE: 'ROOM_UPDATE',
  ROOM_READY: 'ROOM_READY',
  ROOM_START: 'ROOM_START',
  ROOM_KICK: 'ROOM_KICK',
  ROOM_LIST: 'ROOM_LIST',
  ROOM_LIST_RESPONSE: 'ROOM_LIST_RESPONSE',
  
  MATCHMAKING_QUEUE: 'MATCHMAKING_QUEUE',
  MATCHMAKING_QUEUED: 'MATCHMAKING_QUEUED',
  MATCHMAKING_MATCH: 'MATCHMAKING_MATCH',
  MATCHMAKING_CANCEL: 'MATCHMAKING_CANCEL',
  MATCHMAKING_CANCELLED: 'MATCHMAKING_CANCELLED',
  
  GAME_INPUT: 'GAME_INPUT',
  GAME_STATE: 'GAME_STATE',
  GAME_EVENT: 'GAME_EVENT'
} as const

export type MessageType = typeof MessageType[keyof typeof MessageType]

export interface MessageEnvelope {
  readonly version: number
  readonly type: MessageType
  readonly timestamp: number
  readonly sequence: number
  readonly payload: unknown
}

export interface AuthPayload {
  readonly token: string
}

export interface AuthSuccessPayload {
  readonly playerId: string
  readonly username: string
}

export interface AuthFailurePayload {
  readonly reason: string
  readonly code: string
}

export interface RoomCreatePayload {
  readonly name: string
  readonly maxPlayers: number
  readonly gameMode: string
  readonly mapId?: string
  readonly isPublic: boolean
}

export interface RoomJoinPayload {
  readonly roomId: string
}

export interface RoomLeavePayload {
  readonly roomId: string
}

export interface RoomReadyPayload {
  readonly roomId: string
  readonly ready: boolean
}

export interface RoomKickPayload {
  readonly roomId: string
  readonly playerId: string
}

export interface MatchmakingQueuePayload {
  readonly gameMode: string
  readonly timeoutSeconds?: number
}

export interface MatchmakingCancelPayload {
  readonly queueId: string
}

export interface ErrorPayload {
  readonly code: string
  readonly message: string
  readonly details?: unknown
}

export const PROTOCOL_VERSION = 1

export const createEnvelope = (
  type: MessageType,
  payload: unknown,
  sequence: number
): MessageEnvelope => ({
  version: PROTOCOL_VERSION,
  type,
  timestamp: Date.now(),
  sequence,
  payload
})

export const createError = (
  code: string,
  message: string,
  details?: unknown
): MessageEnvelope =>
  createEnvelope(MessageType.ERROR, { code, message, details }, 0)
