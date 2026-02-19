import { Effect } from 'effect'
import type { MatchmakingTicket, Match, CreateTicketInput } from '../entities/matchmaking.entity'
import type { MatchmakingDomainError } from '../errors/matchmaking.errors'

export interface MatchmakingRepository {
  readonly createTicket: (
    input: CreateTicketInput
  ) => Effect.Effect<MatchmakingTicket, MatchmakingDomainError>
  readonly findTicketById: (
    ticketId: string
  ) => Effect.Effect<MatchmakingTicket | null, MatchmakingDomainError>
  readonly findTicketByPlayer: (
    playerId: string
  ) => Effect.Effect<MatchmakingTicket | null, MatchmakingDomainError>
  readonly updateTicketStatus: (
    ticketId: string,
    status: MatchmakingTicket['status'],
    matchId?: string
  ) => Effect.Effect<MatchmakingTicket, MatchmakingDomainError>
  readonly deleteTicket: (ticketId: string) => Effect.Effect<void, MatchmakingDomainError>
  readonly findQueuedTickets: (
    gameMode: string
  ) => Effect.Effect<MatchmakingTicket[], MatchmakingDomainError>
  readonly createMatch: (
    players: string[],
    gameMode: string,
    roomId: string
  ) => Effect.Effect<Match, MatchmakingDomainError>
  readonly findMatchById: (matchId: string) => Effect.Effect<Match | null, MatchmakingDomainError>
}
