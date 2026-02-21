import { Context, Data, Effect, Layer, Option, pipe } from 'effect'
import type { Server } from 'bun'
import { ConnectionManager } from './connection.manager'
import { SessionStore } from './session.store'
import { HeartbeatManager } from './heartbeat.manager'
import { encodeMessage, decodeMessage } from '../protocol/encoder'
import { createError, createEnvelope, MessageType } from '../protocol/message.types'
import type { MessageEnvelope } from '../protocol/message.types'

export class GatewayError extends Data.TaggedError('GatewayError') {
  constructor(
    readonly reason: string,
    readonly code: string
  ) {
    super()
  }
}

export interface WebSocketGateway {
  readonly start: (port: number) => Effect.Effect<Server, GatewayError>
  readonly stop: () => Effect.Effect<void, never>
  readonly broadcast: (message: MessageEnvelope) => Effect.Effect<void, never>
  readonly sendToPlayer: (playerId: string, message: MessageEnvelope) => Effect.Effect<void, never>
  readonly sendToConnection: (connectionId: string, message: MessageEnvelope) => Effect.Effect<void, never>
}

export const WebSocketGateway = Context.Tag<WebSocketGateway>()

let serverInstance: Server | null = null

export const WebSocketGatewayLive = Layer.effect(
  WebSocketGateway,
  Effect.gen(function* () {
    const connectionManager = yield* ConnectionManager
    const sessionStore = yield* SessionStore
    const heartbeatManager = yield* HeartbeatManager

    const sendToSocket = (socket: WebSocket, message: MessageEnvelope) =>
      Effect.gen(function* () {
        const encoded = yield* encodeMessage(message)
        try {
          socket.send(encoded)
        } catch (err) {
          yield* Effect.logError(`Failed to send message: ${err}`)
        }
      })

    const handleMessage = (connectionId: string, data: Uint8Array) =>
      Effect.gen(function* () {
        const decoded = yield* decodeMessage(data)
        yield* connectionManager.incrementMessageCount(connectionId)

        switch (decoded.type) {
          case MessageType.PONG:
            yield* heartbeatManager.handlePong(connectionId)
            break
            
          default:
            yield* Effect.log(`Received message: ${decoded.type}`)
        }
      }).pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`Message handling error: ${error}`)
            const connOpt = yield* connectionManager.get(connectionId)
            if (Option.isSome(connOpt)) {
              yield* sendToSocket(connOpt.value.socket, createError('INVALID_MESSAGE', 'Failed to process message'))
            }
          })
        )
      )

    const handleOpen = (ws: WebSocket) =>
      Effect.gen(function* () {
        yield* Effect.log(`WebSocket connection opened: ${ws.data.connectionId}`)
        yield* connectionManager.add(ws)
        
        const welcomeMessage = createEnvelope(
          MessageType.AUTH,
          { message: 'Connected. Please authenticate.' },
          0
        )
        yield* sendToSocket(ws, welcomeMessage)
      })

    const handleClose = (ws: WebSocket, code: number, reason: string) =>
      Effect.gen(function* () {
        yield* Effect.log(`WebSocket connection closed: ${ws.data.connectionId}, code: ${code}, reason: ${reason}`)
        yield* sessionStore.remove(ws.data.connectionId)
        yield* connectionManager.remove(ws.data.connectionId)
      })

    const handleError = (ws: WebSocket, error: Error) =>
      Effect.gen(function* () {
        yield* Effect.logError(`WebSocket error: ${error.message}`)
      })

    return {
      start: (port: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`Starting WebSocket gateway on port ${port}`)
          
          serverInstance = Bun.serve({
            port,
            websocket: {
              open: (ws) => {
                Effect.runFork(handleOpen(ws))
              },
              close: (ws, code, reason) => {
                Effect.runFork(handleClose(ws, code, reason))
              },
              message: (ws, message) => {
                const data = message instanceof Uint8Array 
                  ? message 
                  : new TextEncoder().encode(message as string)
                Effect.runFork(handleMessage(ws.data.connectionId, data))
              },
              error: (ws, error) => {
                Effect.runFork(handleError(ws, error))
              }
            },
            fetch(req, server) {
              const url = new URL(req.url)
              
              if (url.pathname === '/ws') {
                const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
                const success = server.upgrade(req, {
                  data: { connectionId }
                })
                
                if (success) {
                  return undefined as any
                }
              }
              
              return new Response('Not found', { status: 404 })
            }
          })

          yield* heartbeatManager.start()
          yield* Effect.log(`WebSocket gateway started on port ${port}`)
          
          return serverInstance
        }),

      stop: () =>
        Effect.gen(function* () {
          yield* Effect.log('Stopping WebSocket gateway')
          yield* heartbeatManager.stop()
          
          if (serverInstance) {
            serverInstance.stop()
            serverInstance = null
          }
          
          yield* Effect.log('WebSocket gateway stopped')
        }),

      broadcast: (message: MessageEnvelope) =>
        Effect.gen(function* () {
          const connections = yield* connectionManager.getAll()
          const encoded = yield* encodeMessage(message)
          
          for (const conn of connections) {
            try {
              conn.socket.send(encoded)
            } catch {
              yield* connectionManager.remove(conn.id)
            }
          }
        }),

      sendToPlayer: (playerId: string, message: MessageEnvelope) =>
        Effect.gen(function* () {
          const connOpt = yield* connectionManager.getByPlayerId(playerId)
          if (Option.isNone(connOpt)) {
            return yield* Effect.log(`Player ${playerId} not connected`)
          }
          yield* sendToSocket(connOpt.value.socket, message)
        }),

      sendToConnection: (connectionId: string, message: MessageEnvelope) =>
        Effect.gen(function* () {
          const connOpt = yield* connectionManager.get(connectionId)
          if (Option.isNone(connOpt)) {
            return yield* Effect.log(`Connection ${connectionId} not found`)
          }
          yield* sendToSocket(connOpt.value.socket, message)
        })
    }
  })
)
