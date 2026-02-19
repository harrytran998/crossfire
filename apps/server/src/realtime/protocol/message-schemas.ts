import { Effect, Schema } from 'effect'
import {
  type ClientMessageEnvelope,
  type ClientMessageType,
  type KnownMessageEnvelope,
  type MessageEnvelope,
  ProtocolError,
  type ServerMessageEnvelope,
  type ServerMessageType,
  isClientMessageType,
  isServerMessageType,
} from './message-envelope'

const SequenceSchema = Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0))
const TimestampSchema = Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0))
const EmptyPayloadSchema = Schema.Struct({})

const BaseEnvelopeSchema = Schema.Struct({
  type: Schema.String.pipe(Schema.minLength(1)),
  seq: Schema.optional(SequenceSchema),
  ts: TimestampSchema,
  payload: Schema.Unknown,
})

const JoinLobbyMessageSchema = Schema.Struct({
  type: Schema.Literal('join_lobby'),
  seq: Schema.optional(SequenceSchema),
  ts: TimestampSchema,
  payload: EmptyPayloadSchema,
})

const CreateRoomMessageSchema = Schema.Struct({
  type: Schema.Literal('create_room'),
  seq: Schema.optional(SequenceSchema),
  ts: TimestampSchema,
  payload: Schema.Struct({
    name: Schema.String.pipe(Schema.minLength(1)),
    configId: Schema.String.pipe(Schema.minLength(1)),
    mapId: Schema.String.pipe(Schema.minLength(1)),
    isPrivate: Schema.Boolean,
    password: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
  }),
})

const JoinRoomMessageSchema = Schema.Struct({
  type: Schema.Literal('join_room'),
  seq: Schema.optional(SequenceSchema),
  ts: TimestampSchema,
  payload: Schema.Struct({
    roomId: Schema.String.pipe(Schema.minLength(1)),
    password: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
    loadoutId: Schema.String.pipe(Schema.minLength(1)),
  }),
})

const LeaveRoomMessageSchema = Schema.Struct({
  type: Schema.Literal('leave_room'),
  seq: Schema.optional(SequenceSchema),
  ts: TimestampSchema,
  payload: Schema.Struct({
    roomId: Schema.String.pipe(Schema.minLength(1)),
  }),
})

const SetReadyMessageSchema = Schema.Struct({
  type: Schema.Literal('set_ready'),
  seq: Schema.optional(SequenceSchema),
  ts: TimestampSchema,
  payload: Schema.Struct({
    roomId: Schema.String.pipe(Schema.minLength(1)),
    ready: Schema.Boolean,
  }),
})

const HeartbeatMessageSchema = Schema.Struct({
  type: Schema.Literal('heartbeat'),
  seq: Schema.optional(SequenceSchema),
  ts: TimestampSchema,
  payload: EmptyPayloadSchema,
})

const WelcomeMessageSchema = Schema.Struct({
  type: Schema.Literal('welcome'),
  seq: Schema.optional(SequenceSchema),
  ts: TimestampSchema,
  payload: Schema.Struct({
    connectionId: Schema.String.pipe(Schema.minLength(1)),
  }),
})

const ErrorMessageSchema = Schema.Struct({
  type: Schema.Literal('error'),
  seq: Schema.optional(SequenceSchema),
  ts: TimestampSchema,
  payload: Schema.Struct({
    code: Schema.String.pipe(Schema.minLength(1)),
    message: Schema.String.pipe(Schema.minLength(1)),
  }),
})

const RoomStateMessageSchema = Schema.Struct({
  type: Schema.Literal('room_state'),
  seq: Schema.optional(SequenceSchema),
  ts: TimestampSchema,
  payload: Schema.Struct({
    roomId: Schema.String.pipe(Schema.minLength(1)),
    players: Schema.Array(
      Schema.Struct({
        id: Schema.String.pipe(Schema.minLength(1)),
        ready: Schema.Boolean,
      })
    ),
  }),
})

const PlayerJoinedMessageSchema = Schema.Struct({
  type: Schema.Literal('player_joined'),
  seq: Schema.optional(SequenceSchema),
  ts: TimestampSchema,
  payload: Schema.Struct({
    playerId: Schema.String.pipe(Schema.minLength(1)),
    roomId: Schema.String.pipe(Schema.minLength(1)),
  }),
})

const PlayerLeftMessageSchema = Schema.Struct({
  type: Schema.Literal('player_left'),
  seq: Schema.optional(SequenceSchema),
  ts: TimestampSchema,
  payload: Schema.Struct({
    playerId: Schema.String.pipe(Schema.minLength(1)),
    roomId: Schema.String.pipe(Schema.minLength(1)),
  }),
})

const decodeWithSchema = <A>(
  schema: Schema.Schema<A, A, never>,
  input: unknown,
  code: 'INVALID_ENVELOPE' | 'INVALID_PAYLOAD',
  type?: string
): Effect.Effect<A, ProtocolError> => {
  const decoded = Schema.decodeUnknownEither(schema)(input)

  if (decoded._tag === 'Left') {
    return Effect.fail(
      new ProtocolError({
        code,
        message: code === 'INVALID_ENVELOPE' ? 'Invalid message envelope' : 'Invalid message payload',
        type,
        cause: decoded.left,
      })
    )
  }

  return Effect.succeed(decoded.right)
}

export const validateEnvelope = (input: unknown): Effect.Effect<MessageEnvelope, ProtocolError> =>
  decodeWithSchema(BaseEnvelopeSchema, input, 'INVALID_ENVELOPE')

const clientMessageDecoders: {
  readonly [K in ClientMessageType]: (input: unknown) => Effect.Effect<ClientMessageEnvelope, ProtocolError>
} = {
  join_lobby: (input) =>
    decodeWithSchema(JoinLobbyMessageSchema, input, 'INVALID_PAYLOAD', 'join_lobby').pipe(
      Effect.map((message) => message as ClientMessageEnvelope)
    ),
  create_room: (input) =>
    decodeWithSchema(CreateRoomMessageSchema, input, 'INVALID_PAYLOAD', 'create_room').pipe(
      Effect.map((message) => message as ClientMessageEnvelope)
    ),
  join_room: (input) =>
    decodeWithSchema(JoinRoomMessageSchema, input, 'INVALID_PAYLOAD', 'join_room').pipe(
      Effect.map((message) => message as ClientMessageEnvelope)
    ),
  leave_room: (input) =>
    decodeWithSchema(LeaveRoomMessageSchema, input, 'INVALID_PAYLOAD', 'leave_room').pipe(
      Effect.map((message) => message as ClientMessageEnvelope)
    ),
  set_ready: (input) =>
    decodeWithSchema(SetReadyMessageSchema, input, 'INVALID_PAYLOAD', 'set_ready').pipe(
      Effect.map((message) => message as ClientMessageEnvelope)
    ),
  heartbeat: (input) =>
    decodeWithSchema(HeartbeatMessageSchema, input, 'INVALID_PAYLOAD', 'heartbeat').pipe(
      Effect.map((message) => message as ClientMessageEnvelope)
    ),
}

const serverMessageDecoders: {
  readonly [K in ServerMessageType]: (input: unknown) => Effect.Effect<ServerMessageEnvelope, ProtocolError>
} = {
  welcome: (input) =>
    decodeWithSchema(WelcomeMessageSchema, input, 'INVALID_PAYLOAD', 'welcome').pipe(
      Effect.map((message) => message as ServerMessageEnvelope)
    ),
  error: (input) =>
    decodeWithSchema(ErrorMessageSchema, input, 'INVALID_PAYLOAD', 'error').pipe(
      Effect.map((message) => message as ServerMessageEnvelope)
    ),
  room_state: (input) =>
    decodeWithSchema(RoomStateMessageSchema, input, 'INVALID_PAYLOAD', 'room_state').pipe(
      Effect.map((message) => message as ServerMessageEnvelope)
    ),
  player_joined: (input) =>
    decodeWithSchema(PlayerJoinedMessageSchema, input, 'INVALID_PAYLOAD', 'player_joined').pipe(
      Effect.map((message) => message as ServerMessageEnvelope)
    ),
  player_left: (input) =>
    decodeWithSchema(PlayerLeftMessageSchema, input, 'INVALID_PAYLOAD', 'player_left').pipe(
      Effect.map((message) => message as ServerMessageEnvelope)
    ),
}

export const decodeClientMessage = (input: unknown): Effect.Effect<ClientMessageEnvelope, ProtocolError> =>
  validateEnvelope(input).pipe(
    Effect.flatMap((envelope) => {
      if (!isClientMessageType(envelope.type)) {
        return Effect.fail(
          new ProtocolError({
            code: 'UNKNOWN_MESSAGE_TYPE',
            message: `Unknown client message type: ${envelope.type}`,
            type: envelope.type,
          })
        )
      }

      return clientMessageDecoders[envelope.type](envelope)
    })
  )

export const decodeServerMessage = (input: unknown): Effect.Effect<ServerMessageEnvelope, ProtocolError> =>
  validateEnvelope(input).pipe(
    Effect.flatMap((envelope) => {
      if (!isServerMessageType(envelope.type)) {
        return Effect.fail(
          new ProtocolError({
            code: 'UNKNOWN_MESSAGE_TYPE',
            message: `Unknown server message type: ${envelope.type}`,
            type: envelope.type,
          })
        )
      }

      return serverMessageDecoders[envelope.type](envelope)
    })
  )

export const decodeKnownMessage = (input: unknown): Effect.Effect<KnownMessageEnvelope, ProtocolError> =>
  validateEnvelope(input).pipe(
    Effect.flatMap((envelope) => {
      if (isClientMessageType(envelope.type)) {
        return decodeClientMessage(envelope).pipe(Effect.map((message) => message as KnownMessageEnvelope))
      }

      if (isServerMessageType(envelope.type)) {
        return decodeServerMessage(envelope).pipe(Effect.map((message) => message as KnownMessageEnvelope))
      }

      return Effect.fail(
        new ProtocolError({
          code: 'UNKNOWN_MESSAGE_TYPE',
          message: `Unknown message type: ${envelope.type}`,
          type: envelope.type,
        })
      )
    })
  )

export {
  BaseEnvelopeSchema,
  CreateRoomMessageSchema,
  ErrorMessageSchema,
  HeartbeatMessageSchema,
  JoinLobbyMessageSchema,
  JoinRoomMessageSchema,
  LeaveRoomMessageSchema,
  PlayerJoinedMessageSchema,
  PlayerLeftMessageSchema,
  RoomStateMessageSchema,
  SetReadyMessageSchema,
  WelcomeMessageSchema,
}
