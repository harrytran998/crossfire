import { WebSocketConfig } from '@crossfire/shared'
import { Context, Effect, Layer } from 'effect'
import { ConnectionRegistryService } from './connection-registry.service'
import {
  HEARTBEAT_TIMEOUT_CLOSE_CODE,
  HEARTBEAT_TIMEOUT_CLOSE_REASON,
  type HeartbeatState,
} from './ws-context'

const buildHeartbeatState = (nowMs: number): HeartbeatState => ({
  awaitingPong: false,
  lastPingAtMs: nowMs,
})

export class HeartbeatService extends Context.Tag('HeartbeatService')<
  HeartbeatService,
  {
    readonly registerConnection: (connectionId: string) => Effect.Effect<void>
    readonly unregisterConnection: (connectionId: string) => Effect.Effect<void>
    readonly acknowledgePong: (connectionId: string) => Effect.Effect<void>
    readonly tick: () => Effect.Effect<void>
  }
>() {}

export const HeartbeatServiceLive = Layer.effect(
  HeartbeatService,
  Effect.gen(function* () {
    const config = yield* WebSocketConfig
    const registry = yield* ConnectionRegistryService

    const states = new Map<string, HeartbeatState>()

    const registerConnection = (connectionId: string): Effect.Effect<void> =>
      Effect.sync(() => {
        states.set(connectionId, buildHeartbeatState(Date.now()))
      })

    const unregisterConnection = (connectionId: string): Effect.Effect<void> =>
      Effect.sync(() => {
        states.delete(connectionId)
      })

    const acknowledgePong = (connectionId: string): Effect.Effect<void> =>
      Effect.sync(() => {
        const state = states.get(connectionId)
        if (!state) {
          return
        }

        states.set(connectionId, {
          awaitingPong: false,
          lastPingAtMs: Date.now(),
        })
      })

    const tick = (): Effect.Effect<void> =>
      Effect.gen(function* () {
        const nowMs = Date.now()
        const connections = yield* registry.listConnections()
        const activeConnectionIds = new Set<string>()

        for (const connection of connections) {
          activeConnectionIds.add(connection.connectionId)

          const state = states.get(connection.connectionId)
          if (!state) {
            states.set(connection.connectionId, buildHeartbeatState(nowMs))
            continue
          }

          if (state.awaitingPong) {
            if (nowMs - state.lastPingAtMs > config.pongTimeoutMs) {
              states.delete(connection.connectionId)

              yield* Effect.sync(() => {
                connection.ws.close(HEARTBEAT_TIMEOUT_CLOSE_CODE, HEARTBEAT_TIMEOUT_CLOSE_REASON)
              }).pipe(Effect.orElseSucceed(() => undefined))

              yield* registry.unregisterConnection(connection.connectionId)
            }

            continue
          }

          if (nowMs - state.lastPingAtMs < config.pingIntervalMs) {
            continue
          }

          yield* Effect.sync(() => {
            connection.ws.ping()
          }).pipe(Effect.orElseSucceed(() => undefined))

          states.set(connection.connectionId, {
            awaitingPong: true,
            lastPingAtMs: nowMs,
          })
        }

        for (const connectionId of states.keys()) {
          if (!activeConnectionIds.has(connectionId)) {
            states.delete(connectionId)
          }
        }
      })

    return HeartbeatService.of({
      registerConnection,
      unregisterConnection,
      acknowledgePong,
      tick,
    })
  })
)
