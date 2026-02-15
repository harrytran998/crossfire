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
import { CryptoService } from '../../infrastructure/adapters/crypto.service'
import {
  AuthRepository as AuthRepositoryTag,
  AuthRepositoryLive,
} from '../../infrastructure/repositories/auth.repository.impl'

const TOKEN_EXPIRATION_MS = 60 * 60 * 24 * 7 * 1000

export interface AuthService {
  readonly register: (input: CreateUserInput) => Effect.Effect<AuthResult, InvalidCredentialsError>
  readonly login: (
    input: LoginInput
  ) => Effect.Effect<AuthResult, InvalidCredentialsError | UserBannedError>
  readonly logout: (refreshToken: string) => Effect.Effect<void>
  readonly validateSession: (
    refreshToken: string
  ) => Effect.Effect<{ user: User; session: Session }, UnauthorizedError>
  readonly refreshSession: (refreshToken: string) => Effect.Effect<AuthResult, UnauthorizedError>
  readonly getUserById: (userId: string) => Effect.Effect<User, UserNotFoundError>
}

export const AuthService = Context.GenericTag<AuthService>('AuthService')

export const AuthServiceLive = Layer.effect(
  AuthService,
  Effect.gen(function* () {
    const repo = yield* AuthRepositoryTag
    const crypto = yield* CryptoService

    const createSessionExpiry = () => new Date(Date.now() + TOKEN_EXPIRATION_MS)

    const register = (input: CreateUserInput): Effect.Effect<AuthResult, InvalidCredentialsError> =>
      Effect.gen(function* () {
        const user = yield* repo
          .create(input)
          .pipe(Effect.mapError(() => new InvalidCredentialsError()))
        const token = yield* crypto.generateToken()
        const expiresAt = createSessionExpiry()

        const session = yield* repo.createSession(user.id, token, null, null, expiresAt)

        return { user, session, token }
      })

    const login = (
      input: LoginInput
    ): Effect.Effect<AuthResult, InvalidCredentialsError | UserBannedError> =>
      Effect.gen(function* () {
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

        const session = yield* repo.createSession(user.id, token, null, null, expiresAt)
        yield* repo.updateLastLogin(user.id).pipe(Effect.orDie)

        return { user, session, token }
      })

    const logout = (refreshToken: string): Effect.Effect<void> =>
      Effect.gen(function* () {
        const session = yield* repo.findSessionByToken(refreshToken)
        if (session) {
          yield* repo.revokeSession(session.id)
        }
      })

    const validateSession = (
      refreshToken: string
    ): Effect.Effect<{ user: User; session: Session }, UnauthorizedError> =>
      Effect.gen(function* () {
        const session = yield* repo.findSessionByToken(refreshToken)

        if (!session) {
          return yield* Effect.fail(new UnauthorizedError())
        }

        if (session.revokedAt || new Date() > session.expiresAt) {
          return yield* Effect.fail(new UnauthorizedError())
        }

        const user = yield* repo.findById(session.userId)
        if (!user) {
          return yield* Effect.fail(new UnauthorizedError())
        }

        if (user.isBanned) {
          return yield* Effect.fail(new UnauthorizedError())
        }

        return { user, session }
      })

    const refreshSession = (refreshToken: string): Effect.Effect<AuthResult, UnauthorizedError> =>
      Effect.gen(function* () {
        const { user, session } = yield* validateSession(refreshToken)

        yield* repo.revokeSession(session.id)

        const newToken = yield* crypto.generateToken()
        const expiresAt = createSessionExpiry()
        const newSession = yield* repo.createSession(user.id, newToken, null, null, expiresAt)

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
).pipe(Layer.provide(AuthRepositoryLive))
