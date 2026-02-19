import type { ServerWebSocket } from 'bun'
import { Context, Effect, Layer } from 'effect'
import type {
  RegisteredWebSocketConnection,
  WebSocketConnectionContext,
  WebSocketConnectionEntry,
} from './ws-context'

const toRegisteredConnection = (
  connectionId: string,
  entry: WebSocketConnectionEntry
): RegisteredWebSocketConnection => ({
  connectionId,
  ws: entry.ws,
  playerId: entry.playerId,
  connectedAt: entry.connectedAt,
})

export class ConnectionRegistryService extends Context.Tag('ConnectionRegistryService')<
  ConnectionRegistryService,
  {
    readonly registerConnection: (
      connectionId: string,
      ws: ServerWebSocket<WebSocketConnectionContext>,
      playerId: string
    ) => Effect.Effect<void>
    readonly unregisterConnection: (connectionId: string) => Effect.Effect<void>
    readonly getConnection: (
      connectionId: string
    ) => Effect.Effect<RegisteredWebSocketConnection | null>
    readonly listConnections: () => Effect.Effect<ReadonlyArray<RegisteredWebSocketConnection>>
    readonly size: () => Effect.Effect<number>
  }
>() {}

export const ConnectionRegistryServiceLive = Layer.effect(
  ConnectionRegistryService,
  Effect.sync(() => {
    const connections = new Map<string, WebSocketConnectionEntry>()

    const registerConnection = (
      connectionId: string,
      ws: ServerWebSocket<WebSocketConnectionContext>,
      playerId: string
    ): Effect.Effect<void> =>
      Effect.sync(() => {
        connections.set(connectionId, {
          ws,
          playerId,
          connectedAt: new Date(),
        })
      })

    const unregisterConnection = (connectionId: string): Effect.Effect<void> =>
      Effect.sync(() => {
        connections.delete(connectionId)
      })

    const getConnection = (
      connectionId: string
    ): Effect.Effect<RegisteredWebSocketConnection | null> =>
      Effect.sync(() => {
        const entry = connections.get(connectionId)
        if (!entry) {
          return null
        }

        return toRegisteredConnection(connectionId, entry)
      })

    const listConnections = (): Effect.Effect<ReadonlyArray<RegisteredWebSocketConnection>> =>
      Effect.sync(() => {
        const entries: RegisteredWebSocketConnection[] = []

        for (const [connectionId, entry] of connections.entries()) {
          entries.push(toRegisteredConnection(connectionId, entry))
        }

        return entries
      })

    const size = (): Effect.Effect<number> => Effect.sync(() => connections.size)

    return ConnectionRegistryService.of({
      registerConnection,
      unregisterConnection,
      getConnection,
      listConnections,
      size,
    })
  })
)
