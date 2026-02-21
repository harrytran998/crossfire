import { Effect, Context, Layer } from 'effect'
import { MatchmakingRepositoryImpl } from '../../infrastructure/repositories/matchmaking.repository.impl'
import type {
  MatchmakingTicket,
  Match,
  CreateTicketInput,
  MatchmakingState,
} from '../../domain/entities/matchmaking.entity'
import {
  NotInQueueError,
  type MatchmakingDomainError,
} from '../../domain/errors/matchmaking.errors'

export interface QueueHealth {
  readonly totalQueued: number
  readonly byGameMode: Record<string, number>
  readonly averageWaitTime: number
  readonly matchesCreated: number
}

export interface MatchmakingService {
  readonly joinQueue: (
    input: CreateTicketInput
  ) => Effect.Effect<MatchmakingTicket, MatchmakingDomainError>
  readonly leaveQueue: (playerId: string) => Effect.Effect<void, MatchmakingDomainError>
  readonly getQueueStatus: (
    playerId: string
  ) => Effect.Effect<MatchmakingState | null, MatchmakingDomainError>
  readonly findMatch: (
    gameMode: string,
    playersNeeded: number
  ) => Effect.Effect<Match | null, MatchmakingDomainError>
  readonly getQueueHealth: () => Effect.Effect<QueueHealth, never>
}

export class MatchmakingServiceTag extends Context.Tag('MatchmakingService')<
  MatchmakingServiceTag,
  MatchmakingService
>() {}

export const MatchmakingServiceLive = Layer.effect(
  MatchmakingServiceTag,
  Effect.gen(function* () {
    const repository = yield* MatchmakingRepositoryImpl

    const joinQueue = (
      input: CreateTicketInput
    ): Effect.Effect<MatchmakingTicket, MatchmakingDomainError> => repository.createTicket(input)

    const leaveQueue = (playerId: string): Effect.Effect<void, MatchmakingDomainError> =>
      Effect.gen(function* () {
        const ticket = yield* repository.findTicketByPlayer(playerId)
        if (!ticket || ticket.status !== 'queued') {
          return yield* new NotInQueueError({ playerId })
        }
        yield* repository.deleteTicket(ticket.id)
      })

    const getQueueStatus = (
      playerId: string
    ): Effect.Effect<MatchmakingState | null, MatchmakingDomainError> =>
      Effect.gen(function* () {
        const ticket = yield* repository.findTicketByPlayer(playerId)
        if (!ticket) return null

        const position =
          ticket.status === 'queued'
            ? yield* Effect.gen(function* () {
                const queued = yield* repository.findQueuedTickets(ticket.gameMode)
                return queued.findIndex((t) => t.queuedAt.getTime() > ticket.queuedAt.getTime()) + 1
              })
            : undefined

        return {
          ticketId: ticket.id,
          status: ticket.status,
          position,
          estimatedWait: position ? position * 30 : undefined,
        }
      })

    const findMatch = (
      gameMode: string,
      playersNeeded: number
    ): Effect.Effect<Match | null, MatchmakingDomainError> =>
      Effect.gen(function* () {
        const queued = yield* repository.findQueuedTickets(gameMode)
        if (queued.length < playersNeeded) return null

        const players = queued.slice(0, playersNeeded)
        const playerIds = players.map((p) => p.playerId)

        const roomId = crypto.randomUUID()
        const match = yield* repository.createMatch(playerIds, gameMode, roomId)

        for (const player of players) {
          yield* repository.updateTicketStatus(player.id, 'matched', match.id)
        }

        return match
      })

    const getQueueHealth = (): Effect.Effect<QueueHealth, never> =>
      Effect.gen(function* () {
        const allTickets = yield* repository.findAllTickets()
        const queued = allTickets.filter((t) => t.status === 'queued')
        const matches = allTickets.filter((t) => t.status === 'matched')

        const byGameMode: Record<string, number> = {}
        for (const ticket of queued) {
          byGameMode[ticket.gameMode] = (byGameMode[ticket.gameMode] || 0) + 1
        }

        const now = Date.now()
        const waitTimes = queued.map((t) => now - t.queuedAt.getTime())
        const averageWaitTime =
          waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length / 1000 : 0

        return {
          totalQueued: queued.length,
          byGameMode,
          averageWaitTime: Math.round(averageWaitTime),
          matchesCreated: matches.length,
        }
      })

    return MatchmakingServiceTag.of({
      joinQueue,
      leaveQueue,
      getQueueStatus,
      findMatch,
      getQueueHealth,
    })
  })
)
