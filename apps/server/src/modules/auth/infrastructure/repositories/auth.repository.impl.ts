import { Effect, Context, Layer } from 'effect'
import { DatabaseService } from '../../../../services/database.service'
import type { AuthRepository as AuthRepositoryType } from '../../domain/repositories/auth.repository'
import type { User, Session, CreateUserInput, UserRow, SessionRow } from '../../domain/entities/user.entity'
import { mapUserRowToEntity, mapSessionRowToEntity } from '../../domain/entities/user.entity'
import { UserAlreadyExistsError, UserNotFoundError } from '../../domain/errors/auth.errors'
import { CryptoService, CryptoServiceLive } from '../adapters/crypto.service'

export const AuthRepository = Context.GenericTag<AuthRepositoryType>('AuthRepository')

export const AuthRepositoryLive = Layer.effect(
  AuthRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService
    const crypto = yield* CryptoService

    const findByEmail = (email: string): Effect.Effect<User | null> =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('users')
          .where('email', '=', email)
          .selectAll()
          .executeTakeFirst()
        return row ? mapUserRowToEntity(row as unknown as UserRow) : null
      }).pipe(Effect.orDie)

    const findByUsername = (username: string): Effect.Effect<User | null> =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('users')
          .where('username', '=', username)
          .selectAll()
          .executeTakeFirst()
        return row ? mapUserRowToEntity(row as unknown as UserRow) : null
      }).pipe(Effect.orDie)

    const findById = (id: string): Effect.Effect<User | null> =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('users')
          .where('id', '=', id)
          .selectAll()
          .executeTakeFirst()
        return row ? mapUserRowToEntity(row as unknown as UserRow) : null
      }).pipe(Effect.orDie)

    const create = (
      input: CreateUserInput
    ): Effect.Effect<User, UserAlreadyExistsError> =>
      Effect.gen(function* () {
        const existingEmail = yield* findByEmail(input.email)
        if (existingEmail) {
          return yield* Effect.fail(new UserAlreadyExistsError({ field: 'email' }))
        }

        const existingUsername = yield* findByUsername(input.username)
        if (existingUsername) {
          return yield* Effect.fail(new UserAlreadyExistsError({ field: 'username' }))
        }

        const passwordHash = yield* crypto.hashPassword(input.password)

        const row = yield* Effect.promise(async () => {
          return await db
            .insertInto('users')
            .values({
              username: input.username,
              email: input.email,
              password_hash: passwordHash,
              email_verified: false,
              is_active: true,
              is_banned: false,
            })
            .returningAll()
            .executeTakeFirstOrThrow()
        }).pipe(
          Effect.mapError(() => new UserAlreadyExistsError({ field: 'email' }))
        )

        return mapUserRowToEntity(row as unknown as UserRow)
      })

    const updateLastLogin = (userId: string): Effect.Effect<void, UserNotFoundError> =>
      Effect.gen(function* () {
        const result = yield* Effect.promise(async () => {
          return await db
            .updateTable('users')
            .set({ last_login_at: new Date() })
            .where('id', '=', userId)
            .execute()
        }).pipe(Effect.mapError(() => new UserNotFoundError()))

        if (result.length === 0) {
          return yield* Effect.fail(new UserNotFoundError())
        }
      })

    const createSession = (
      userId: string,
      refreshToken: string,
      ipAddress: string | null,
      userAgent: string | null,
      expiresAt: Date
    ): Effect.Effect<Session> =>
      Effect.promise(async () => {
        const row = await db
          .insertInto('sessions')
          .values({
            user_id: userId,
            refresh_token: refreshToken,
            ip_address: ipAddress,
            user_agent: userAgent,
            expires_at: expiresAt,
          })
          .returningAll()
          .executeTakeFirstOrThrow()
        return mapSessionRowToEntity(row as unknown as SessionRow)
      }).pipe(Effect.orDie)

    const findSessionByToken = (refreshToken: string): Effect.Effect<Session | null> =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('sessions')
          .where('refresh_token', '=', refreshToken)
          .selectAll()
          .executeTakeFirst()
        return row ? mapSessionRowToEntity(row as unknown as SessionRow) : null
      }).pipe(Effect.orDie)

    const revokeSession = (sessionId: string): Effect.Effect<void> =>
      Effect.promise(async () => {
        await db
          .updateTable('sessions')
          .set({ revoked_at: new Date() })
          .where('id', '=', sessionId)
          .execute()
      }).pipe(Effect.orDie)

    const revokeAllUserSessions = (userId: string): Effect.Effect<void> =>
      Effect.promise(async () => {
        await db
          .updateTable('sessions')
          .set({ revoked_at: new Date() })
          .where('user_id', '=', userId)
          .where('revoked_at', 'is', null)
          .execute()
      }).pipe(Effect.orDie)

    return AuthRepository.of({
      findByEmail,
      findByUsername,
      findById,
      create,
      updateLastLogin,
      createSession,
      findSessionByToken,
      revokeSession,
      revokeAllUserSessions,
    })
  })
).pipe(Layer.provide(CryptoServiceLive))
