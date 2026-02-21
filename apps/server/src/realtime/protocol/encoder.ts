import { encode, decode } from '@msgpack/msgpack'
import { Effect } from 'effect'
import type { MessageEnvelope } from './message.types'

export class DecodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DecodeError'
  }
}

export const encodeMessage = (envelope: MessageEnvelope): Effect.Effect<Uint8Array, never> =>
  Effect.sync(() => encode(envelope))

export const decodeMessage = (data: Uint8Array): Effect.Effect<MessageEnvelope, DecodeError> =>
  Effect.try({
    try: () => decode(data) as MessageEnvelope,
    catch: (error) => new DecodeError(error instanceof Error ? error.message : 'Unknown decode error')
  })
