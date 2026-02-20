import { Effect, Context, Layer } from 'effect'
import { GameConfig } from '@crossfire/shared'
import { RedisService } from '../../../../services/redis.service'
import { RedisError } from '../../../../errors'
import type { MatchmakingRepository } from '../../domain/repositories/matchmaking.repository'
import type {
  MatchmakingTicket,
  Match,
  CreateTicketInput,
} from '../../domain/entities/matchmaking.entity'
import {
  TicketNotFoundError,
  PlayerAlreadyQueuedError,
  MatchmakingError,
  type MatchmakingDomainError,
} from '../../domain/errors/matchmaking.errors'

const TICKET_KEY_PREFIX = 'mm:ticket:'
const PLAYER_TICKET_PREFIX = 'mm:player:'
const QUEUE_PREFIX = 'mm:queue:'
const MATCH_KEY_PREFIX = 'mm:match:'

const mapRedisError = (_err: RedisError): MatchmakingDomainError =>
  new MatchmakingError({ message: 'Redis operation failed' })

const serializeTicket = (ticket: MatchmakingTicket): string =>
  JSON.stringify({
    ...ticket,
    queuedAt: ticket.queuedAt.toISOString(),
  })

const deserializeTicket = (data: string): MatchmakingTicket => {
  const parsed = JSON.parse(data)
  return {
    ...parsed,
    queuedAt: new Date(parsed.queuedAt),
  }
}

const serializeMatch = (match: Match): string =>
  JSON.stringify({
    ...match,
    createdAt: match.createdAt.toISOString(),
  })

const deserializeMatch = (data: string): Match => {
  const parsed = JSON.parse(data)
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
  }
}

export class MatchmakingRepositoryImpl extends Context.Tag('MatchmakingRepositoryImpl')<
  MatchmakingRepositoryImpl,
  MatchmakingRepository
>() {}

export const MatchmakingRepositoryLive = Layer.effect(
  MatchmakingRepositoryImpl,
  Effect.gen(function* () {
    const redis = yield* RedisService
    const gameConfig = yield* GameConfig

    const createTicket = (
      input: CreateTicketInput
    ): Effect.Effect<MatchmakingTicket, MatchmakingDomainError> =>
      Effect.gen(function* () {
        const existingTicket = yield* findTicketByPlayer(input.playerId)
        if (existingTicket && existingTicket.status === 'queued') {
          return yield* new PlayerAlreadyQueuedError({ playerId: input.playerId })
        }

        const id = crypto.randomUUID()
        const ticket: MatchmakingTicket = {
          id,
          playerId: input.playerId,
          gameMode: input.gameMode,
          skillRating: input.skillRating,
          queuedAt: new Date(),
          status: 'queued',
        }

        const ticketKey = `${TICKET_KEY_PREFIX}${id}`
        const playerKey = `${PLAYER_TICKET_PREFIX}${input.playerId}`
        const queueKey = `${QUEUE_PREFIX}${input.gameMode}`

        yield* redis
          .set(ticketKey, serializeTicket(ticket), gameConfig.roomTtlSeconds)
          .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))
        yield* redis
          .set(playerKey, id, gameConfig.roomTtlSeconds)
          .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))

        yield* Effect.tryPromise({
          try: () => redis.client.zadd(queueKey, input.skillRating, id),
          catch: () => new MatchmakingError({ message: 'Failed to add to queue' }),
        })

        return ticket
      })

    const findTicketById = (
      ticketId: string
    ): Effect.Effect<MatchmakingTicket | null, MatchmakingDomainError> =>
      Effect.gen(function* () {
        const data = yield* redis
          .get(`${TICKET_KEY_PREFIX}${ticketId}`)
          .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))
        if (!data) return null
        return deserializeTicket(data)
      })

    const findTicketByPlayer = (
      playerId: string
    ): Effect.Effect<MatchmakingTicket | null, MatchmakingDomainError> =>
      Effect.gen(function* () {
        const ticketId = yield* redis
          .get(`${PLAYER_TICKET_PREFIX}${playerId}`)
          .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))
        if (!ticketId) return null
        return yield* findTicketById(ticketId)
      })

    const updateTicketStatus = (
      ticketId: string,
      status: MatchmakingTicket['status'],
      matchId?: string
    ): Effect.Effect<MatchmakingTicket, MatchmakingDomainError> =>
      Effect.gen(function* () {
        const ticket = yield* findTicketById(ticketId)
        if (!ticket) return yield* new TicketNotFoundError({ ticketId })

        const updated: MatchmakingTicket = { ...ticket, status, matchId }
        yield* redis
          .set(`${TICKET_KEY_PREFIX}${ticketId}`, serializeTicket(updated), gameConfig.roomTtlSeconds)
          .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))

        return updated
      })

    const deleteTicket = (ticketId: string): Effect.Effect<void, MatchmakingDomainError> =>
      Effect.gen(function* () {
        const ticket = yield* findTicketById(ticketId)
        if (ticket) {
          yield* redis
            .del(`${TICKET_KEY_PREFIX}${ticketId}`)
            .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))
          yield* redis
            .del(`${PLAYER_TICKET_PREFIX}${ticket.playerId}`)
            .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))
          yield* Effect.tryPromise({
            try: () => redis.client.zrem(`${QUEUE_PREFIX}${ticket.gameMode}`, ticketId),
            catch: () => new MatchmakingError({ message: 'Failed to remove from queue' }),
          })
        }
      })

    const findQueuedTickets = (
      gameMode: string
    ): Effect.Effect<MatchmakingTicket[], MatchmakingDomainError> =>
      Effect.gen(function* () {
        const ticketIds = yield* Effect.tryPromise({
          try: () => redis.client.zrange(`${QUEUE_PREFIX}${gameMode}`, 0, -1),
          catch: () => new MatchmakingError({ message: 'Failed to get queue' }),
        })

        const tickets = yield* Effect.all(
          ticketIds.map((id) => findTicketById(id)),
          { concurrency: gameConfig.matchmakingMaxConcurrency }
        )

        return tickets.filter((t): t is MatchmakingTicket => t !== null && t.status === 'queued')
      })

    const createMatch = (
      players: string[],
      gameMode: string,
      roomId: string
    ): Effect.Effect<Match, MatchmakingDomainError> =>
      Effect.gen(function* () {
        const id = crypto.randomUUID()
        const match: Match = {
          id,
          roomId,
          players,
          gameMode,
          createdAt: new Date(),
        }

        yield* redis
          .set(`${MATCH_KEY_PREFIX}${id}`, serializeMatch(match), gameConfig.roomTtlSeconds)
          .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))
        return match
      })

    const findMatchById = (matchId: string): Effect.Effect<Match | null, MatchmakingDomainError> =>
      Effect.gen(function* () {
        const data = yield* redis
          .get(`${MATCH_KEY_PREFIX}${matchId}`)
          .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))
        if (!data) return null
        return deserializeMatch(data)
      })

    return MatchmakingRepositoryImpl.of({
      createTicket,
      findTicketById,
      findTicketByPlayer,
      updateTicketStatus,
      deleteTicket,
      findQueuedTickets,
      createMatch,
      findMatchById,
    })
  })
)
