import { Effect, Context, Layer } from 'effect'
import { sql } from 'kysely'
import type { JsonValue, OutboxMessages } from '@crossfire/database'
import { DatabaseError } from '../errors'
import { DatabaseService } from './database.service'

export interface EnqueueOutboxMessageInput {
  readonly aggregateType: string
  readonly aggregateId: string | null
  readonly eventType: string
  readonly payload: JsonValue
  readonly idempotencyKey: string
  readonly maxAttempts?: number
}

export interface ClaimedOutboxMessage {
  readonly id: string
  readonly aggregateType: string
  readonly aggregateId: string | null
  readonly eventType: string
  readonly payload: JsonValue
  readonly idempotencyKey: string
  readonly status: string
  readonly attempts: number
  readonly maxAttempts: number
  readonly nextAttemptAt: Date
  readonly lastError: string | null
  readonly processedAt: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

const mapOutboxMessage = (row: OutboxMessages): ClaimedOutboxMessage => {
  const safeRow = row as unknown as Record<string, unknown>

  return {
    id: String(safeRow.id),
    aggregateType: String(safeRow.aggregate_type),
    aggregateId: (safeRow.aggregate_id as string | null) ?? null,
    eventType: String(safeRow.event_type),
    payload: (safeRow.payload as JsonValue) ?? {},
    idempotencyKey: String(safeRow.idempotency_key),
    status: String(safeRow.status),
    attempts: Number(safeRow.attempts),
    maxAttempts: Number(safeRow.max_attempts),
    nextAttemptAt: safeRow.next_attempt_at as Date,
    lastError: (safeRow.last_error as string | null) ?? null,
    processedAt: (safeRow.processed_at as Date | null) ?? null,
    createdAt: safeRow.created_at as Date,
    updatedAt: safeRow.updated_at as Date,
  }
}

export class OutboxService extends Context.Tag('OutboxService')<
  OutboxService,
  {
    readonly enqueue: (input: EnqueueOutboxMessageInput) => Effect.Effect<string, DatabaseError>
    readonly claimPending: (limit: number) => Effect.Effect<ReadonlyArray<ClaimedOutboxMessage>, DatabaseError>
    readonly isConsumerProcessed: (
      consumerName: string,
      idempotencyKey: string
    ) => Effect.Effect<boolean, DatabaseError>
    readonly markProcessed: (
      messageId: string,
      consumerName: string,
      idempotencyKey: string
    ) => Effect.Effect<void, DatabaseError>
    readonly scheduleRetry: (
      messageId: string,
      errorMessage: string,
      nextAttemptAt: Date
    ) => Effect.Effect<void, DatabaseError>
    readonly moveToDeadLetter: (
      message: ClaimedOutboxMessage,
      failureReason: string
    ) => Effect.Effect<void, DatabaseError>
  }
>() {}

export const OutboxServiceLive = Layer.effect(
  OutboxService,
  Effect.gen(function* () {
    const { db, query } = yield* DatabaseService

    const enqueue = (input: EnqueueOutboxMessageInput): Effect.Effect<string, DatabaseError> =>
      query(async (dbClient) => {
        const inserted = await dbClient
          .insertInto('outbox_messages')
          .values({
            aggregate_type: input.aggregateType,
            aggregate_id: input.aggregateId,
            event_type: input.eventType,
            payload: input.payload,
            idempotency_key: input.idempotencyKey,
            max_attempts: input.maxAttempts ?? 5,
          })
          .returning('id')
          .executeTakeFirstOrThrow()

        return String(inserted.id)
      })

    const claimPending = (limit: number): Effect.Effect<ReadonlyArray<ClaimedOutboxMessage>, DatabaseError> =>
      query(async (dbClient) => {
        const now = new Date()

        const pending = await dbClient
          .selectFrom('outbox_messages')
          .select('id')
          .where('status', '=', 'pending')
          .where('next_attempt_at', '<=', now)
          .orderBy('created_at', 'asc')
          .limit(limit)
          .execute()

        if (pending.length === 0) {
          return []
        }

        const ids = pending.map((message) => String(message.id))

        const claimed = await dbClient
          .updateTable('outbox_messages')
          .set({
            status: 'processing',
            attempts: sql<number>`attempts + 1`,
            updated_at: now,
          })
          .where('id', 'in', ids)
          .returningAll()
          .execute()

        return claimed.map((row) => mapOutboxMessage(row as unknown as OutboxMessages))
      })

    const isConsumerProcessed = (
      consumerName: string,
      idempotencyKey: string
    ): Effect.Effect<boolean, DatabaseError> =>
      query(async (dbClient) => {
        const row = await dbClient
          .selectFrom('outbox_consumers')
          .select('id')
          .where('consumer_name', '=', consumerName)
          .where('idempotency_key', '=', idempotencyKey)
          .executeTakeFirst()

        return row != null
      })

    const markProcessed = (
      messageId: string,
      consumerName: string,
      idempotencyKey: string
    ): Effect.Effect<void, DatabaseError> =>
      query(async () => {
        const now = new Date()

        await db
          .transaction()
          .execute(async (trx) => {
            await trx
              .insertInto('outbox_consumers')
              .values({
                consumer_name: consumerName,
                idempotency_key: idempotencyKey,
              })
              .onConflict((oc) => oc.columns(['consumer_name', 'idempotency_key']).doNothing())
              .execute()

            await trx
              .updateTable('outbox_messages')
              .set({
                status: 'processed',
                processed_at: now,
                last_error: null,
                updated_at: now,
              })
              .where('id', '=', messageId)
              .execute()
          })
      })

    const scheduleRetry = (
      messageId: string,
      errorMessage: string,
      nextAttemptAt: Date
    ): Effect.Effect<void, DatabaseError> =>
      query(async (dbClient) => {
        await dbClient
          .updateTable('outbox_messages')
          .set({
            status: 'pending',
            last_error: errorMessage,
            next_attempt_at: nextAttemptAt,
            updated_at: new Date(),
          })
          .where('id', '=', messageId)
          .execute()
      })

    const moveToDeadLetter = (
      message: ClaimedOutboxMessage,
      failureReason: string
    ): Effect.Effect<void, DatabaseError> =>
      query(async () => {
        const now = new Date()

        await db
          .transaction()
          .execute(async (trx) => {
            await trx
              .insertInto('outbox_dead_letters')
              .values({
                outbox_message_id: message.id,
                event_type: message.eventType,
                payload: message.payload,
                idempotency_key: message.idempotencyKey,
                failure_reason: failureReason,
                failed_at: now,
              })
              .onConflict((oc) => oc.column('outbox_message_id').doNothing())
              .execute()

            await trx
              .updateTable('outbox_messages')
              .set({
                status: 'dead_letter',
                last_error: failureReason,
                processed_at: now,
                updated_at: now,
              })
              .where('id', '=', message.id)
              .execute()
          })
      })

    return OutboxService.of({
      enqueue,
      claimPending,
      isConsumerProcessed,
      markProcessed,
      scheduleRetry,
      moveToDeadLetter,
    })
  })
)
