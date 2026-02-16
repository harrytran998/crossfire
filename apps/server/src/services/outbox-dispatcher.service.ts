import { Effect, Context, Layer } from 'effect'
import { DatabaseError } from '../errors'
import { DatabaseService } from './database.service'
import { OutboxService, OutboxServiceLive, type ClaimedOutboxMessage } from './outbox.service'

const DISPATCHER_CONSUMER_NAME = 'server.outbox.dispatcher'
const MAX_BACKOFF_SECONDS = 300

export interface OutboxDispatchStats {
  readonly processed: number
  readonly failed: number
  readonly deadLettered: number
}

type OutboxHandler = (message: ClaimedOutboxMessage) => Effect.Effect<void, unknown>

interface UserRegisteredPayload {
  readonly userId: string
  readonly email: string
  readonly username: string
  readonly timestamp: string
}

interface UserLoggedInPayload {
  readonly userId: string
  readonly sessionId: string
  readonly ipAddress: string | null
  readonly timestamp: string
}

interface UserSessionPayload {
  readonly userId: string
  readonly sessionId: string
  readonly timestamp: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const parseUserRegisteredPayload = (payload: unknown): UserRegisteredPayload => {
  if (!isRecord(payload)) {
    throw new Error('Invalid UserRegistered payload')
  }

  if (
    typeof payload.userId !== 'string' ||
    typeof payload.email !== 'string' ||
    typeof payload.username !== 'string' ||
    typeof payload.timestamp !== 'string'
  ) {
    throw new Error('Invalid UserRegistered payload fields')
  }

  return {
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
    timestamp: payload.timestamp,
  }
}

const parseUserLoggedInPayload = (payload: unknown): UserLoggedInPayload => {
  if (!isRecord(payload)) {
    throw new Error('Invalid UserLoggedIn payload')
  }

  if (
    typeof payload.userId !== 'string' ||
    typeof payload.sessionId !== 'string' ||
    typeof payload.timestamp !== 'string' ||
    (payload.ipAddress !== null &&
      typeof payload.ipAddress !== 'string' &&
      payload.ipAddress !== undefined)
  ) {
    throw new Error('Invalid UserLoggedIn payload fields')
  }

  return {
    userId: payload.userId,
    sessionId: payload.sessionId,
    ipAddress: payload.ipAddress == null ? null : payload.ipAddress,
    timestamp: payload.timestamp,
  }
}

const parseUserSessionPayload = (payload: unknown): UserSessionPayload => {
  if (!isRecord(payload)) {
    throw new Error('Invalid session payload')
  }

  if (
    typeof payload.userId !== 'string' ||
    typeof payload.sessionId !== 'string' ||
    typeof payload.timestamp !== 'string'
  ) {
    throw new Error('Invalid session payload fields')
  }

  return {
    userId: payload.userId,
    sessionId: payload.sessionId,
    timestamp: payload.timestamp,
  }
}

const parseEventTimestamp = (value: string): Date => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid timestamp: ${value}`)
  }
  return parsed
}

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Unknown outbox handler failure'
}

const computeNextAttemptAt = (attempts: number): Date => {
  const exponentialDelay = 2 ** Math.max(1, attempts)
  const boundedDelay = Math.min(MAX_BACKOFF_SECONDS, exponentialDelay)
  return new Date(Date.now() + boundedDelay * 1000)
}

interface DispatcherDependencies {
  readonly db: DatabaseService['Type']['db']
}

const getHandler = (
  message: ClaimedOutboxMessage,
  deps: DispatcherDependencies
): OutboxHandler | null => {
  if (message.eventType === 'UserRegistered') {
    return () =>
      Effect.tryPromise({
        try: async () => {
          const payload = parseUserRegisteredPayload(message.payload)

          const user = await deps.db
            .selectFrom('users')
            .select(['id', 'email', 'username'])
            .where('id', '=', payload.userId)
            .executeTakeFirst()

          if (!user) {
            throw new Error(`User not found for UserRegistered event userId=${payload.userId}`)
          }
        },
        catch: (error) =>
          error instanceof Error ? error : new Error('UserRegistered handler failed'),
      })
  }

  if (message.eventType === 'UserLoggedIn') {
    return () =>
      Effect.tryPromise({
        try: async () => {
          const payload = parseUserLoggedInPayload(message.payload)
          const timestamp = parseEventTimestamp(payload.timestamp)

          await deps.db
            .updateTable('users')
            .set({
              last_login_at: timestamp,
              updated_at: new Date(),
            })
            .where('id', '=', payload.userId)
            .execute()
        },
        catch: (error) =>
          error instanceof Error ? error : new Error('UserLoggedIn handler failed'),
      })
  }

  if (message.eventType === 'UserLoggedOut' || message.eventType === 'SessionExpired') {
    return () =>
      Effect.tryPromise({
        try: async () => {
          const payload = parseUserSessionPayload(message.payload)
          const timestamp = parseEventTimestamp(payload.timestamp)

          await deps.db
            .updateTable('sessions')
            .set({
              revoked_at: timestamp,
            })
            .where('id', '=', payload.sessionId)
            .where('user_id', '=', payload.userId)
            .where('revoked_at', 'is', null)
            .execute()
        },
        catch: (error) =>
          error instanceof Error ? error : new Error('UserLoggedOut/SessionExpired handler failed'),
      })
  }

  return null
}

export class OutboxDispatcherService extends Context.Tag('OutboxDispatcherService')<
  OutboxDispatcherService,
  {
    readonly processPending: (limit?: number) => Effect.Effect<OutboxDispatchStats, DatabaseError>
  }
>() {}

export const OutboxDispatcherServiceLive = Layer.effect(
  OutboxDispatcherService,
  Effect.gen(function* () {
    const outbox = yield* OutboxService
    const database = yield* DatabaseService

    const processPending = (limit = 50): Effect.Effect<OutboxDispatchStats, DatabaseError> =>
      Effect.gen(function* () {
        const pendingMessages = yield* outbox.claimPending(limit)

        let processed = 0
        let failed = 0
        let deadLettered = 0

        for (const message of pendingMessages) {
          const wasAlreadyProcessed = yield* outbox.isConsumerProcessed(
            DISPATCHER_CONSUMER_NAME,
            message.idempotencyKey
          )

          if (wasAlreadyProcessed) {
            yield* outbox.markProcessed(
              message.id,
              DISPATCHER_CONSUMER_NAME,
              message.idempotencyKey
            )
            processed += 1
            continue
          }

          const handler = getHandler(message, { db: database.db })

          if (handler == null) {
            const noHandlerMessage = `No outbox handler configured for event_type=${message.eventType}`

            if (message.attempts >= message.maxAttempts) {
              yield* outbox.moveToDeadLetter(message, noHandlerMessage)
              deadLettered += 1
            } else {
              yield* outbox.scheduleRetry(
                message.id,
                noHandlerMessage,
                computeNextAttemptAt(message.attempts)
              )
              failed += 1
            }

            continue
          }

          const handled = yield* handler(message).pipe(
            Effect.map(() => ({ ok: true as const })),
            Effect.catchAll((error) =>
              Effect.succeed({
                ok: false as const,
                errorMessage: toErrorMessage(error),
              })
            )
          )

          if (handled.ok) {
            yield* outbox.markProcessed(
              message.id,
              DISPATCHER_CONSUMER_NAME,
              message.idempotencyKey
            )
            processed += 1
            continue
          }

          if (message.attempts >= message.maxAttempts) {
            yield* outbox.moveToDeadLetter(message, handled.errorMessage)
            deadLettered += 1
            continue
          }

          yield* outbox.scheduleRetry(
            message.id,
            handled.errorMessage,
            computeNextAttemptAt(message.attempts)
          )
          failed += 1
        }

        return {
          processed,
          failed,
          deadLettered,
        }
      })

    return OutboxDispatcherService.of({
      processPending,
    })
  })
).pipe(Layer.provide(OutboxServiceLive))
