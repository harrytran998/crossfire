import type { Effect } from 'effect'
import type { User, Session, CreateUserInput } from '../entities/user.entity'
import type { UserAlreadyExistsError, UserNotFoundError } from '../errors/auth.errors'

export interface AuthRepository {
  readonly findByEmail: (email: string) => Effect.Effect<User | null>
  readonly findByUsername: (username: string) => Effect.Effect<User | null>
  readonly findById: (id: string) => Effect.Effect<User | null>
  readonly create: (input: CreateUserInput) => Effect.Effect<User, UserAlreadyExistsError>
  readonly updateLastLogin: (userId: string) => Effect.Effect<void, UserNotFoundError>
  readonly createSession: (
    userId: string,
    refreshToken: string,
    ipAddress: string | null,
    userAgent: string | null,
    expiresAt: Date
  ) => Effect.Effect<Session>
  readonly findSessionByToken: (refreshToken: string) => Effect.Effect<Session | null>
  readonly revokeSession: (sessionId: string) => Effect.Effect<void>
  readonly revokeAllUserSessions: (userId: string) => Effect.Effect<void>
}
