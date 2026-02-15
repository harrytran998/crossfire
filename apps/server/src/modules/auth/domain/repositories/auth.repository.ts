import type { Effect } from 'effect'
import type { User, Session, CreateUserInput } from '../entities/user.entity'
import type { UserAlreadyExistsError, UserNotFoundError } from '../errors/auth.errors'

export interface AuthRepository {
  readonly findByEmail: (email: string) => Effect.Effect<User | null, never>
  readonly findByUsername: (username: string) => Effect.Effect<User | null, never>
  readonly findById: (id: string) => Effect.Effect<User | null, never>
  readonly create: (
    input: CreateUserInput
  ) => Effect.Effect<User, UserAlreadyExistsError>
  readonly updateLastLogin: (
    userId: string
  ) => Effect.Effect<void, UserNotFoundError>
  readonly createSession: (
    userId: string,
    refreshToken: string,
    ipAddress: string | null,
    userAgent: string | null,
    expiresAt: Date
  ) => Effect.Effect<Session, never>
  readonly findSessionByToken: (
    refreshToken: string
  ) => Effect.Effect<Session | null, never>
  readonly revokeSession: (sessionId: string) => Effect.Effect<void, never>
  readonly revokeAllUserSessions: (userId: string) => Effect.Effect<void, never>
}
