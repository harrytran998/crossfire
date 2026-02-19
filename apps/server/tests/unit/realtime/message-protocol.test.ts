import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { pack } from 'msgpackr'
import {
  MessageRouter,
  ProtocolError,
  decodeClientMessage,
  decodeMessage,
  encodeMessage,
} from '../../../src/realtime/protocol'

describe('Realtime Message Protocol', () => {
  test('encodes and decodes envelopes through MessagePack codec', async () => {
    const message = {
      type: 'join_room',
      seq: 7,
      ts: Date.now(),
      payload: {
        roomId: 'room-1',
        loadoutId: 'loadout-1',
      },
    } as const

    const decoded = await Effect.runPromise(
      encodeMessage(message).pipe(Effect.flatMap((encoded) => decodeMessage(encoded)))
    )

    expect(decoded).toEqual(message)
  })

  test('returns typed ProtocolError on decode failure', async () => {
    const error = await Effect.runPromise(
      decodeMessage(new Uint8Array([0xde, 0x00, 0x01, 0xa1])).pipe(Effect.flip)
    )

    expect(error).toBeInstanceOf(ProtocolError)
    expect(error.code).toBe('DECODE_FAILED')
  })

  test('returns typed ProtocolError for invalid envelope shape', async () => {
    const encoded = pack({ invalid: true })
    const error = await Effect.runPromise(decodeMessage(encoded).pipe(Effect.flip))

    expect(error).toBeInstanceOf(ProtocolError)
    expect(error.code).toBe('INVALID_ENVELOPE')
  })

  test('rejects unknown client message type through schema validation', async () => {
    const error = await Effect.runPromise(
      decodeClientMessage({
        type: 'unknown_type',
        ts: Date.now(),
        payload: {},
      }).pipe(Effect.flip)
    )

    expect(error).toBeInstanceOf(ProtocolError)
    expect(error.code).toBe('UNKNOWN_MESSAGE_TYPE')
  })

  test('dispatches known message type through router map', async () => {
    const router = new MessageRouter()
    let handledRoomId: string | null = null

    router.register('join_room', (message) =>
      Effect.sync(() => {
        handledRoomId = message.payload.roomId
      })
    )

    await Effect.runPromise(
      router.dispatch({
        type: 'join_room',
        ts: Date.now(),
        payload: {
          roomId: 'room-42',
          loadoutId: 'loadout-42',
        },
      })
    )

    expect(handledRoomId === 'room-42').toBe(true)
  })

  test('returns typed ProtocolError when handler is missing', async () => {
    const router = new MessageRouter()

    const error = await Effect.runPromise(
      router
        .dispatch({
          type: 'heartbeat',
          ts: Date.now(),
          payload: {},
        })
        .pipe(Effect.flip)
    )

    expect(error).toBeInstanceOf(ProtocolError)
    expect(error.code).toBe('HANDLER_NOT_FOUND')
  })

  test('returns typed ProtocolError for invalid known payload', async () => {
    const router = new MessageRouter()
    router.register('join_room', () => Effect.void)

    const error = await Effect.runPromise(
      router
        .dispatch({
          type: 'join_room',
          ts: Date.now(),
          payload: {
            roomId: '',
            loadoutId: 'loadout-1',
          },
        })
        .pipe(Effect.flip)
    )

    expect(error).toBeInstanceOf(ProtocolError)
    expect(error.code).toBe('INVALID_PAYLOAD')
  })
})
