import { Effect } from 'effect'
import {
  type ClientMessageEnvelope,
  type MessageEnvelope,
  ProtocolError,
} from './message-envelope'
import { decodeClientMessage } from './message-schemas'

export type MessageHandler<TMessage extends ClientMessageEnvelope = ClientMessageEnvelope> = (
  message: TMessage
) => Effect.Effect<void, ProtocolError>

type ErasedMessageHandler = MessageHandler<ClientMessageEnvelope>

export class MessageRouter {
  private readonly handlers = new Map<ClientMessageEnvelope['type'], ErasedMessageHandler>()

  register<TType extends ClientMessageEnvelope['type']>(
    type: TType,
    handler: MessageHandler<Extract<ClientMessageEnvelope, { readonly type: TType }>>
  ): this {
    this.handlers.set(type, (message) =>
      handler(message as Extract<ClientMessageEnvelope, { readonly type: TType }>)
    )

    return this
  }

  hasHandler(type: ClientMessageEnvelope['type']): boolean {
    return this.handlers.has(type)
  }

  dispatch(message: MessageEnvelope): Effect.Effect<void, ProtocolError> {
    return decodeClientMessage(message).pipe(
      Effect.flatMap((validatedMessage) => {
        const handler = this.handlers.get(validatedMessage.type)

        if (!handler) {
          return Effect.fail(
            new ProtocolError({
              code: 'HANDLER_NOT_FOUND',
              message: `No handler registered for message type: ${validatedMessage.type}`,
              type: validatedMessage.type,
            })
          )
        }

        return handler(validatedMessage)
      })
    )
  }
}
