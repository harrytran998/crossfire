import { z } from 'zod'
import { MessageType, PROTOCOL_VERSION } from './message.types'

const MessageTypeSchema = z.nativeEnum(MessageType)

export const MessageEnvelopeSchema = z.object({
  version: z.number().int().min(1).max(1),
  type: MessageTypeSchema,
  timestamp: z.number().int(),
  sequence: z.number().int().min(0),
  payload: z.unknown()
})

export const AuthPayloadSchema = z.object({
  token: z.string().min(1)
})

export const AuthSuccessPayloadSchema = z.object({
  playerId: z.string(),
  username: z.string()
})

export const AuthFailurePayloadSchema = z.object({
  reason: z.string(),
  code: z.string()
})

export const RoomCreatePayloadSchema = z.object({
  name: z.string().min(1).max(50),
  maxPlayers: z.number().int().min(2).max(10),
  gameMode: z.string(),
  mapId: z.string().optional(),
  isPublic: z.boolean()
})

export const RoomJoinPayloadSchema = z.object({
  roomId: z.string().uuid()
})

export const RoomLeavePayloadSchema = z.object({
  roomId: z.string().uuid()
})

export const RoomReadyPayloadSchema = z.object({
  roomId: z.string().uuid(),
  ready: z.boolean()
})

export const RoomKickPayloadSchema = z.object({
  roomId: z.string().uuid(),
  playerId: z.string().uuid()
})

export const MatchmakingQueuePayloadSchema = z.object({
  gameMode: z.string(),
  timeoutSeconds: z.number().int().min(30).max(300).optional()
})

export const MatchmakingCancelPayloadSchema = z.object({
  queueId: z.string().uuid()
})

export const ErrorPayloadSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional()
})

const payloadSchemas: Record<MessageType, z.ZodType<unknown> | null> = {
  [MessageType.AUTH]: AuthPayloadSchema,
  [MessageType.AUTH_SUCCESS]: AuthSuccessPayloadSchema,
  [MessageType.AUTH_FAILURE]: AuthFailurePayloadSchema,
  [MessageType.PING]: z.object({}),
  [MessageType.PONG]: z.object({}),
  [MessageType.ERROR]: ErrorPayloadSchema,
  [MessageType.ROOM_CREATE]: RoomCreatePayloadSchema,
  [MessageType.ROOM_CREATED]: RoomCreatePayloadSchema,
  [MessageType.ROOM_JOIN]: RoomJoinPayloadSchema,
  [MessageType.ROOM_JOINED]: RoomJoinPayloadSchema,
  [MessageType.ROOM_LEAVE]: RoomLeavePayloadSchema,
  [MessageType.ROOM_LEFT]: RoomLeavePayloadSchema,
  [MessageType.ROOM_UPDATE]: z.object({ room: z.unknown() }),
  [MessageType.ROOM_READY]: RoomReadyPayloadSchema,
  [MessageType.ROOM_START]: RoomLeavePayloadSchema,
  [MessageType.ROOM_KICK]: RoomKickPayloadSchema,
  [MessageType.ROOM_LIST]: z.object({}),
  [MessageType.ROOM_LIST_RESPONSE]: z.object({ rooms: z.array(z.unknown()) }),
  [MessageType.MATCHMAKING_QUEUE]: MatchmakingQueuePayloadSchema,
  [MessageType.MATCHMAKING_QUEUED]: MatchmakingQueuePayloadSchema,
  [MessageType.MATCHMAKING_MATCH]: z.object({ matchId: z.string(), players: z.array(z.string()) }),
  [MessageType.MATCHMAKING_CANCEL]: MatchmakingCancelPayloadSchema,
  [MessageType.MATCHMAKING_CANCELLED]: MatchmakingCancelPayloadSchema,
  [MessageType.GAME_INPUT]: z.object({ input: z.unknown() }),
  [MessageType.GAME_STATE]: z.object({ state: z.unknown() }),
  [MessageType.GAME_EVENT]: z.object({ event: z.string(), data: z.unknown() })
}

export const validateMessage = (data: unknown) => {
  const envelopeResult = MessageEnvelopeSchema.safeParse(data)
  
  if (!envelopeResult.success) {
    return {
      success: false,
      error: `Invalid message envelope: ${envelopeResult.error.message}`
    } as const
  }

  const envelope = envelopeResult.data

  if (envelope.version !== PROTOCOL_VERSION) {
    return {
      success: false,
      error: `Unsupported protocol version: ${envelope.version}. Expected: ${PROTOCOL_VERSION}`
    } as const
  }

  const payloadSchema = payloadSchemas[envelope.type]
  if (payloadSchema) {
    const payloadResult = payloadSchema.safeParse(envelope.payload)
    if (!payloadResult.success) {
      return {
        success: false,
        error: `Invalid payload for ${envelope.type}: ${payloadResult.error.message}`
      } as const
    }
  }

  return {
    success: true,
    data: envelope
  } as const
}

export type ValidatedMessage = ReturnType<typeof validateMessage>
