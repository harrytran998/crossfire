import { Effect, Context, Layer } from 'effect'
import type {
  User,
  Session,
  CreateUserInput,
  LoginInput,
  AuthResult,
} from '../../domain/entities/user.entity'
import {
  InvalidCredentialsError,
  UserBannedError,
  UserNotFoundError,
  UnauthorizedError,
} from '../../domain/errors/auth.errors'
import { CryptoService, CryptoServiceLive } from '../../infrastructure/adapters/crypto.service'
import {
  AuthRepository as AuthRepositoryTag,
  AuthRepositoryLive,
} from '../../infrastructure/repositories/auth.repository.impl'
import {
  SessionExpired,
  UserLoggedIn,
  UserLoggedOut,
  UserRegistered,
} from '../../domain/events/auth.events'
import { OutboxService, OutboxServiceLive } from '../../../../services/outbox.service'

const TOKEN_EXPIRATION_MS = 60 * 60 * 24 * 1000

export interface SessionContextInput {
  readonly ipAddress: string | null
  readonly userAgent: string | null
}

const normalizeSessionContext = (
  input?: SessionContextInput
): {
  ipAddress: string | null
  userAgent: string | null
} => ({
  ipAddress: input?.ipAddress ?? null,
  userAgent: input?.userAgent ?? null,
})

export interface AuthService {
  readonly register: (
    input: CreateUserInput,
    context?: SessionContextInput
  ) => Effect.Effect<AuthResult, InvalidCredentialsError>
  readonly login: (
    input: LoginInput,
    context?: SessionContextInput
  ) => Effect.Effect<AuthResult, InvalidCredentialsError | UserBannedError>
  readonly logout: (refreshToken: string, context?: SessionContextInput) => Effect.Effect<void>
  readonly validateSession: (
    refreshToken: string,
    context?: SessionContextInput
  ) => Effect.Effect<{ user: User; session: Session }, UnauthorizedError>
  readonly refreshSession: (
    refreshToken: string,
    context?: SessionContextInput
  ) => Effect.Effect<AuthResult, UnauthorizedError>
  readonly getUserById: (userId: string) => Effect.Effect<User, UserNotFoundError>
}

export const AuthService = Context.GenericTag<AuthService>('AuthService')

export const AuthServiceLive = Layer.effect(
  AuthService,
  Effect.gen(function* () {
    const repo = yield* AuthRepositoryTag
    const crypto = yield* CryptoService
    const outbox = yield* OutboxService

    const createSessionExpiry = () => new Date(Date.now() + TOKEN_EXPIRATION_MS)

    const register = (
      input: CreateUserInput,
      context?: SessionContextInput
    ): Effect.Effect<AuthResult, InvalidCredentialsError> =>
      Effect.gen(function* () {
        const sessionContext = normalizeSessionContext(context)
        const user = yield* repo
          .create(input)
          .pipe(Effect.mapError(() => new InvalidCredentialsError()))
        const token = yield* crypto.generateToken()
        const expiresAt = createSessionExpiry()

        const session = yield* repo.createSession(
          user.id,
          token,
          sessionContext.ipAddress,
          sessionContext.userAgent,
          expiresAt
        )

        const event = new UserRegistered({
          userId: user.id,
          email: user.email,
          username: user.username,
          timestamp: new Date(),
        })

        yield* outbox
          .enqueue({
            aggregateType: 'user',
            aggregateId: user.id,
            eventType: event._tag,
            payload: {
              userId: event.userId,
              email: event.email,
              username: event.username,
              timestamp: event.timestamp.toISOString(),
            },
            idempotencyKey: `auth:user-registered:${user.id}`,
          })
          .pipe(Effect.orDie)

        return { user, session, token }
      })

    const login = (
      input: LoginInput,
      context?: SessionContextInput
    ): Effect.Effect<AuthResult, InvalidCredentialsError | UserBannedError> =>
      Effect.gen(function* () {
        const sessionContext = normalizeSessionContext(context)
        const user = yield* repo.findByEmail(input.email)

        if (!user) {
          return yield* Effect.fail(new InvalidCredentialsError())
        }

        const isValidPassword = yield* crypto.verifyPassword(input.password, user.passwordHash)
        if (!isValidPassword) {
          return yield* Effect.fail(new InvalidCredentialsError())
        }

        if (user.isBanned) {
          return yield* Effect.fail(
            new UserBannedError({
              reason: user.banReason,
              until: user.bannedUntil,
            })
          )
        }

        const token = yield* crypto.generateToken()
        const expiresAt = createSessionExpiry()

        const session = yield* repo.createSession(
          user.id,
          token,
          sessionContext.ipAddress,
          sessionContext.userAgent,
          expiresAt
        )
        yield* repo.updateLastLogin(user.id).pipe(Effect.orDie)

        const event = new UserLoggedIn({
          userId: user.id,
          sessionId: session.id,
          ipAddress: session.ipAddress,
          timestamp: new Date(),
        })

        yield* outbox
          .enqueue({
            aggregateType: 'session',
            aggregateId: session.id,
            eventType: event._tag,
            payload: {
              userId: event.userId,
              sessionId: event.sessionId,
              ipAddress: event.ipAddress,
              timestamp: event.timestamp.toISOString(),
            },
            idempotencyKey: `auth:user-logged-in:${session.id}`,
          })
          .pipe(Effect.orDie)

        return { user, session, token }
      })

    const logout = (refreshToken: string): Effect.Effect<void> =>
      Effect.gen(function* () {
        const session = yield* repo.findSessionByToken(refreshToken)
        if (session) {
          yield* repo.revokeSession(session.id)

          const event = new UserLoggedOut({
            userId: session.userId,
            sessionId: session.id,
            timestamp: new Date(),
          })

          yield* outbox
            .enqueue({
              aggregateType: 'session',
              aggregateId: session.id,
              eventType: event._tag,
              payload: {
                userId: event.userId,
                sessionId: event.sessionId,
                timestamp: event.timestamp.toISOString(),
              },
              idempotencyKey: `auth:user-logged-out:${session.id}`,
            })
            .pipe(Effect.orDie)
        }
      })

    const validateSession = (
      refreshToken: string,
      context?: SessionContextInput
    ): Effect.Effect<{ user: User; session: Session }, UnauthorizedError> =>
      Effect.gen(function* () {
        const sessionContext = normalizeSessionContext(context)
        const session = yield* repo.findSessionByToken(refreshToken)

        if (!session) {
          return yield* Effect.fail(new UnauthorizedError())
        }

        if (session.revokedAt || new Date() > session.expiresAt) {
          if (session.revokedAt == null) {
            yield* repo.revokeSession(session.id).pipe(Effect.orDie)

            const event = new SessionExpired({
              userId: session.userId,
              sessionId: session.id,
              timestamp: new Date(),
            })

            yield* outbox
              .enqueue({
                aggregateType: 'session',
                aggregateId: session.id,
                eventType: event._tag,
                payload: {
                  userId: event.userId,
                  sessionId: event.sessionId,
                  timestamp: event.timestamp.toISOString(),
                },
                idempotencyKey: `auth:session-expired:${session.id}`,
              })
              .pipe(Effect.orDie)
          }

          return yield* Effect.fail(new UnauthorizedError())
        }

        const user = yield* repo.findById(session.userId)
        if (!user) {
          return yield* Effect.fail(new UnauthorizedError())
        }

        if (user.isBanned) {
          return yield* Effect.fail(new UnauthorizedError())
        }

        if (
          sessionContext.ipAddress &&
          session.ipAddress &&
          sessionContext.ipAddress !== session.ipAddress
        ) {
          return yield* Effect.fail(new UnauthorizedError())
        }

        if (
          sessionContext.userAgent &&
          session.userAgent &&
          sessionContext.userAgent !== session.userAgent
        ) {
          return yield* Effect.fail(new UnauthorizedError())
        }

        return { user, session }
      })

    const refreshSession = (
      refreshToken: string,
      context?: SessionContextInput
    ): Effect.Effect<AuthResult, UnauthorizedError> =>
      Effect.gen(function* () {
        const sessionContext = normalizeSessionContext(context)
        const { user, session } = yield* validateSession(refreshToken, sessionContext)

        yield* repo.revokeSession(session.id)

        const newToken = yield* crypto.generateToken()
        const expiresAt = createSessionExpiry()
        const newSession = yield* repo.createSession(
          user.id,
          newToken,
          sessionContext.ipAddress,
          sessionContext.userAgent,
          expiresAt
        )

        return { user, session: newSession, token: newToken }
      })

    const getUserById = (userId: string): Effect.Effect<User, UserNotFoundError> =>
      Effect.gen(function* () {
        const user = yield* repo.findById(userId)
        if (!user) {
          return yield* Effect.fail(new UserNotFoundError())
        }
        return user
      })

    return AuthService.of({
      register,
      login,
      logout,
      validateSession,
      refreshSession,
      getUserById,
    })
  })
).pipe(
  Layer.provide(AuthRepositoryLive),
  Layer.provide(CryptoServiceLive),
  Layer.provide(OutboxServiceLive)
)
