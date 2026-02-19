import { Data } from 'effect'

export interface MessageEnvelope<TType extends string = string, TPayload = unknown> {
  readonly type: TType
  readonly seq?: number
  readonly ts: number
  readonly payload: TPayload
}

export type ClientMessage =
  | { readonly type: 'join_lobby'; readonly payload: Record<string, never> }
  | {
      readonly type: 'create_room'
      readonly payload: {
        readonly name: string
        readonly configId: string
        readonly mapId: string
        readonly isPrivate: boolean
        readonly password?: string
      }
    }
  | {
      readonly type: 'join_room'
      readonly payload: {
        readonly roomId: string
        readonly password?: string
        readonly loadoutId: string
      }
    }
  | { readonly type: 'leave_room'; readonly payload: { readonly roomId: string } }
  | { readonly type: 'set_ready'; readonly payload: { readonly roomId: string; readonly ready: boolean } }
  | { readonly type: 'heartbeat'; readonly payload: Record<string, never> }

export type ServerMessage =
  | { readonly type: 'welcome'; readonly payload: { readonly connectionId: string } }
  | { readonly type: 'error'; readonly payload: { readonly code: string; readonly message: string } }
  | {
      readonly type: 'room_state'
      readonly payload: {
        readonly roomId: string
        readonly players: ReadonlyArray<{ readonly id: string; readonly ready: boolean }>
      }
    }
  | { readonly type: 'player_joined'; readonly payload: { readonly playerId: string; readonly roomId: string } }
  | { readonly type: 'player_left'; readonly payload: { readonly playerId: string; readonly roomId: string } }

export const CLIENT_MESSAGE_TYPES = [
  'join_lobby',
  'create_room',
  'join_room',
  'leave_room',
  'set_ready',
  'heartbeat',
] as const

export const SERVER_MESSAGE_TYPES = [
  'welcome',
  'error',
  'room_state',
  'player_joined',
  'player_left',
] as const

export type ClientMessageType = (typeof CLIENT_MESSAGE_TYPES)[number]
export type ServerMessageType = (typeof SERVER_MESSAGE_TYPES)[number]

export type ClientMessageEnvelope = {
  [M in ClientMessage as M['type']]: MessageEnvelope<M['type'], M['payload']>
}[ClientMessageType]

export type ServerMessageEnvelope = {
  [M in ServerMessage as M['type']]: MessageEnvelope<M['type'], M['payload']>
}[ServerMessageType]

export type KnownMessageEnvelope = ClientMessageEnvelope | ServerMessageEnvelope

const CLIENT_MESSAGE_TYPE_SET = new Set<string>(CLIENT_MESSAGE_TYPES)
const SERVER_MESSAGE_TYPE_SET = new Set<string>(SERVER_MESSAGE_TYPES)

export const isClientMessageType = (type: string): type is ClientMessageType =>
  CLIENT_MESSAGE_TYPE_SET.has(type)

export const isServerMessageType = (type: string): type is ServerMessageType =>
  SERVER_MESSAGE_TYPE_SET.has(type)

export type ProtocolErrorCode =
  | 'DECODE_FAILED'
  | 'ENCODE_FAILED'
  | 'INVALID_ENVELOPE'
  | 'UNKNOWN_MESSAGE_TYPE'
  | 'INVALID_PAYLOAD'
  | 'HANDLER_NOT_FOUND'

export class ProtocolError extends Data.TaggedError('ProtocolError')<{
  readonly code: ProtocolErrorCode
  readonly message: string
  readonly type?: string
  readonly cause?: unknown
}> {}
