import { Context, Data, Effect, Layer, Option, Ref } from 'effect'

export interface Connection {
  readonly id: string
  readonly socket: WebSocket
  readonly playerId: Option.Option<string>
  readonly connectedAt: number
  readonly lastPingAt: number
  readonly messageCount: number
}

export class ConnectionError extends Data.TaggedError('ConnectionError') {
  constructor(
    readonly reason: string,
    readonly code: string
  ) {
    super()
  }
}

interface ConnectionManagerState {
  readonly connections: Map<string, Connection>
  readonly playerToConnection: Map<string, string>
}

export interface ConnectionManager {
  readonly add: (socket: WebSocket) => Effect.Effect<Connection, ConnectionError>
  readonly remove: (connectionId: string) => Effect.Effect<void, ConnectionError>
  readonly get: (connectionId: string) => Effect.Effect<Option.Option<Connection>, never>
  readonly getByPlayerId: (playerId: string) => Effect.Effect<Option.Option<Connection>, never>
  readonly setPlayerId: (connectionId: string, playerId: string) => Effect.Effect<void, ConnectionError>
  readonly getAll: () => Effect.Effect<Connection[], never>
  readonly updateLastPing: (connectionId: string) => Effect.Effect<void, never>
  readonly incrementMessageCount: (connectionId: string) => Effect.Effect<void, never>
  readonly cleanupStale: (maxAgeMs: number) => Effect.Effect<string[], never>
}

export const ConnectionManager = Context.Tag<ConnectionManager>()

export const ConnectionManagerLive = Layer.effect(
  ConnectionManager,
  Effect.gen(function* () {
    const stateRef = yield* Ref.make<ConnectionManagerState>({
      connections: new Map(),
      playerToConnection: new Map()
    })

    const generateId = () => {
      return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    }

    return {
      add: (socket: WebSocket) =>
        Effect.gen(function* () {
          const connectionId = generateId()
          const now = Date.now()
          
          const connection: Connection = {
            id: connectionId,
            socket,
            playerId: Option.none(),
            connectedAt: now,
            lastPingAt: now,
            messageCount: 0
          }

          yield* Ref.update(stateRef, (state) => ({
            ...state,
            connections: new Map([...state.connections, [connectionId, connection]])
          }))

          return connection
        }),

      remove: (connectionId: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef)
          const connection = state.connections.get(connectionId)

          if (!connection) {
            return yield* Effect.fail(
              new ConnectionError('Connection not found', 'CONN_NOT_FOUND')
            )
          }

          yield* Ref.update(stateRef, (state) => {
            const newConnections = new Map(state.connections)
            newConnections.delete(connectionId)

            const newPlayerToConnection = new Map(state.playerToConnection)
            if (Option.isSome(connection.playerId)) {
              newPlayerToConnection.delete(connection.playerId.value)
            }

            return {
              connections: newConnections,
              playerToConnection: newPlayerToConnection
            }
          })
        }),

      get: (connectionId: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef)
          return Option.fromNullable(state.connections.get(connectionId))
        }),

      getByPlayerId: (playerId: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef)
          const connectionId = state.playerToConnection.get(playerId)
          if (!connectionId) return Option.none()
          return Option.fromNullable(state.connections.get(connectionId))
        }),

      setPlayerId: (connectionId: string, playerId: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef)
          const connection = state.connections.get(connectionId)

          if (!connection) {
            return yield* Effect.fail(
              new ConnectionError('Connection not found', 'CONN_NOT_FOUND')
            )
          }

          yield* Ref.update(stateRef, (state) => ({
            connections: new Map([
              ...state.connections,
              [connectionId, { ...connection, playerId: Option.some(playerId) }]
            ]),
            playerToConnection: new Map([
              ...state.playerToConnection,
              [playerId, connectionId]
            ])
          }))
        }),

      getAll: () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef)
          return Array.from(state.connections.values())
        }),

      updateLastPing: (connectionId: string) =>
        Effect.gen(function* () {
          yield* Ref.update(stateRef, (state) => {
            const connection = state.connections.get(connectionId)
            if (!connection) return state

            return {
              ...state,
              connections: new Map([
                ...state.connections,
                [connectionId, { ...connection, lastPingAt: Date.now() }]
              ])
            }
          })
        }),

      incrementMessageCount: (connectionId: string) =>
        Effect.gen(function* () {
          yield* Ref.update(stateRef, (state) => {
            const connection = state.connections.get(connectionId)
            if (!connection) return state

            return {
              ...state,
              connections: new Map([
                ...state.connections,
                [connectionId, { ...connection, messageCount: connection.messageCount + 1 }]
              ])
            }
          })
        }),

      cleanupStale: (maxAgeMs: number) =>
        Effect.gen(function* () {
          const now = Date.now()
          const state = yield* Ref.get(stateRef)
          
          const staleIds: string[] = []
          
          for (const [id, conn] of state.connections) {
            if (now - conn.lastPingAt > maxAgeMs) {
              staleIds.push(id)
            }
          }

          yield* Ref.update(stateRef, (state) => {
            const newConnections = new Map(state.connections)
            const newPlayerToConnection = new Map(state.playerToConnection)

            for (const id of staleIds) {
              const conn = newConnections.get(id)
              if (conn && Option.isSome(conn.playerId)) {
                newPlayerToConnection.delete(conn.playerId.value)
              }
              newConnections.delete(id)
            }

            return {
              connections: newConnections,
              playerToConnection: newPlayerToConnection
            }
          })

          return staleIds
        })
    }
  })
)
