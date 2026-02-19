import { Effect } from 'effect'
import { pack, unpack } from 'msgpackr'
import { type MessageEnvelope, ProtocolError } from './message-envelope'
import { validateEnvelope } from './message-schemas'

export const encodeMessage = (message: MessageEnvelope): Effect.Effect<Uint8Array, ProtocolError> =>
  validateEnvelope(message).pipe(
    Effect.flatMap((validated) =>
      Effect.try({
        try: () => pack(validated),
        catch: (cause: unknown) =>
          new ProtocolError({
            code: 'ENCODE_FAILED',
            message: 'Failed to encode message envelope',
            cause,
          }),
      })
    )
  )

export const decodeMessage = (
  input: ArrayBuffer | Uint8Array
): Effect.Effect<MessageEnvelope, ProtocolError> => {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)

  return Effect.try({
    try: () => unpack(bytes),
    catch: (cause: unknown) =>
      new ProtocolError({
        code: 'DECODE_FAILED',
        message: 'Failed to decode MessagePack payload',
        cause,
      }),
  }).pipe(Effect.flatMap((decoded) => validateEnvelope(decoded)))
}
