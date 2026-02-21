import { Data } from 'effect'

export interface QueueEntry {
  readonly id: string
  readonly playerId: string
  readonly gameMode: string
  readonly skillRating: number
  readonly joinedAt: number
  readonly timeoutAt: number
}

export interface Match {
  readonly id: string
  readonly gameMode: string
  readonly playerIds: string[]
  readonly createdAt: number
}

export class MatchmakingError extends Data.TaggedError('MatchmakingError') {
  constructor(
    readonly reason: string,
    readonly code: MatchmakingErrorCode
  ) {
    super()
  }
}

export type MatchmakingErrorCode =
  | 'ALREADY_IN_QUEUE'
  | 'NOT_IN_QUEUE'
  | 'INVALID_GAME_MODE'
  | 'QUEUE_TIMEOUT'
  | 'MATCHMAKING_FAILED'
