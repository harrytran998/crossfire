import { Context, Data, Effect, Layer, Option, Schedule, pipe } from 'effect'
import { ConnectionManager } from './connection.manager'

export class HeartbeatError extends Data.TaggedError('HeartbeatError') {
  constructor(
    readonly connectionId: string,
    readonly reason: string
  ) {
    super()
  }
}

export interface HeartbeatConfig {
  readonly pingIntervalMs: number
  readonly pongTimeoutMs: number
  readonly cleanupIntervalMs: number
}

export const defaultHeartbeatConfig: HeartbeatConfig = {
  pingIntervalMs: 30000,
  pongTimeoutMs: 60000,
  cleanupIntervalMs: 10000
}

export interface HeartbeatManager {
  readonly start: () => Effect.Effect<void, never>
  readonly stop: () => Effect.Effect<void, never>
  readonly handlePong: (connectionId: string) => Effect.Effect<void, never>
}

export const HeartbeatManager = Context.Tag<HeartbeatManager>()

export const HeartbeatManagerLive = Layer.effect(
  HeartbeatManager,
  Effect.gen(function* () {
    const connectionManager = yield* ConnectionManager
    const config = defaultHeartbeatConfig
    
    let isRunning = false

    const sendPing = (connectionId: string) =>
      Effect.gen(function* () {
        const connOpt = yield* connectionManager.get(connectionId)
        if (Option.isNone(connOpt)) return
        
        const conn = connOpt.value
        try {
          conn.socket.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }))
        } catch {
          yield* connectionManager.remove(connectionId)
        }
      })

    const cleanupStaleConnections = () =>
      Effect.gen(function* () {
        yield* connectionManager.cleanupStale(config.pongTimeoutMs)
      })

    const startHeartbeatLoop = () =>
      pipe(
        Effect.gen(function* () {
          const connections = yield* connectionManager.getAll()
          for (const conn of connections) {
            const timeSinceLastPing = Date.now() - conn.lastPingAt
            if (timeSinceLastPing >= config.pingIntervalMs) {
              yield* sendPing(conn.id)
            }
          }
        }),
        Effect.repeat(Schedule.spaced(config.pingIntervalMs)),
        Effect.forkDaemon
      )

    const startCleanupLoop = () =>
      pipe(
        cleanupStaleConnections(),
        Effect.repeat(Schedule.spaced(config.cleanupIntervalMs)),
        Effect.forkDaemon
      )

    return {
      start: () =>
        Effect.gen(function* () {
          if (isRunning) return
          isRunning = true
          yield* Effect.log('Starting heartbeat manager')
          yield* startHeartbeatLoop()
          yield* startCleanupLoop()
        }),

      stop: () =>
        Effect.gen(function* () {
          isRunning = false
          yield* Effect.log('Stopping heartbeat manager')
        }),

      handlePong: (connectionId: string) =>
        Effect.gen(function* () {
          yield* connectionManager.updateLastPing(connectionId)
        })
    }
  })
)
