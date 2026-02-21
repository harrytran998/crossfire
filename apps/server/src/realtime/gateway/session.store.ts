import { Context, Data, Effect, Layer, Option } from 'effect'
import { RedisService } from '../../../services/redis.service'

export interface Session {
  readonly connectionId: string
  readonly playerId: string
  readonly token: string
  readonly connectedAt: number
  readonly lastActivityAt: number
}

export class SessionError extends Data.TaggedError('SessionError') {
  constructor(
    readonly reason: string,
    readonly code: string
  ) {
    super()
  }
}

export interface SessionStore {
  readonly create: (session: Session) => Effect.Effect<void, SessionError>
  readonly get: (connectionId: string) => Effect.Effect<Option.Option<Session>, never>
  readonly getByPlayerId: (playerId: string) => Effect.Effect<Option.Option<Session>, never>
  readonly updateActivity: (connectionId: string) => Effect.Effect<void, never>
  readonly remove: (connectionId: string) => Effect.Effect<void, never>
  readonly getAllActive: () => Effect.Effect<Session[], never>
}

export const SessionStore = Context.Tag<SessionStore>()

const SESSION_KEY = (id: string) => `session:${id}`
const PLAYER_SESSION_KEY = (playerId: string) => `session:player:${playerId}`
const ACTIVE_SESSIONS_KEY = 'sessions:active'

export const SessionStoreLive = Layer.effect(
  SessionStore,
  Effect.gen(function* () {
    const redis = yield* RedisService

    return {
      create: (session: Session) =>
        Effect.gen(function* () {
          const sessionKey = SESSION_KEY(session.connectionId)
          const playerKey = PLAYER_SESSION_KEY(session.playerId)
          
          yield* redis.set(sessionKey, JSON.stringify(session))
          yield* redis.set(playerKey, session.connectionId)
          yield* redis.sadd(ACTIVE_SESSIONS_KEY, session.connectionId)
        }),

      get: (connectionId: string) =>
        Effect.gen(function* () {
          const data = yield* redis.get(SESSION_KEY(connectionId))
          if (!data) return Option.none()
          return Option.some(JSON.parse(data) as Session)
        }),

      getByPlayerId: (playerId: string) =>
        Effect.gen(function* () {
          const connectionId = yield* redis.get(PLAYER_SESSION_KEY(playerId))
          if (!connectionId) return Option.none()
          const data = yield* redis.get(SESSION_KEY(connectionId))
          if (!data) return Option.none()
          return Option.some(JSON.parse(data) as Session)
        }),

      updateActivity: (connectionId: string) =>
        Effect.gen(function* () {
          const data = yield* redis.get(SESSION_KEY(connectionId))
          if (data) {
            const session = JSON.parse(data) as Session
            const updated = { ...session, lastActivityAt: Date.now() }
            yield* redis.set(SESSION_KEY(connectionId), JSON.stringify(updated))
          }
        }),

      remove: (connectionId: string) =>
        Effect.gen(function* () {
          const data = yield* redis.get(SESSION_KEY(connectionId))
          if (data) {
            const session = JSON.parse(data) as Session
            yield* redis.del(PLAYER_SESSION_KEY(session.playerId))
          }
          yield* redis.del(SESSION_KEY(connectionId))
          yield* redis.srem(ACTIVE_SESSIONS_KEY, connectionId)
        }),

      getAllActive: () =>
        Effect.gen(function* () {
          const ids = yield* redis.smembers(ACTIVE_SESSIONS_KEY)
          const sessions: Session[] = []
          
          for (const id of ids) {
            const data = yield* redis.get(SESSION_KEY(id))
            if (data) {
              sessions.push(JSON.parse(data) as Session)
            }
          }
          
          return sessions
        })
    }
  })
)
