export type MatchmakingStatus = 'queued' | 'matched' | 'cancelled'

export interface MatchmakingTicket {
  readonly id: string
  readonly playerId: string
  readonly gameMode: string
  readonly skillRating: number
  readonly queuedAt: Date
  readonly status: MatchmakingStatus
  readonly matchId?: string
}

export interface Match {
  readonly id: string
  readonly roomId: string
  readonly players: string[]
  readonly gameMode: string
  readonly createdAt: Date
}

export interface CreateTicketInput {
  playerId: string
  gameMode: string
  skillRating: number
}

export interface MatchmakingState {
  ticketId: string
  status: MatchmakingStatus
  position?: number
  estimatedWait?: number
}
