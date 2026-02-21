import { Context, Effect, Option } from 'effect'
import type { QueueEntry, Match, MatchmakingError } from '../domain/matchmaking'

export interface MatchmakingRepository {
  readonly enqueue: (entry: QueueEntry) => Effect.Effect<void, MatchmakingError>
  readonly dequeue: (playerId: string) => Effect.Effect<void, MatchmakingError>
  readonly getEntry: (playerId: string) => Effect.Effect<Option<QueueEntry>, never>
  readonly getQueueForMode: (gameMode: string) => Effect.Effect<QueueEntry[], never>
  readonly getQueueLength: (gameMode: string) => Effect.Effect<number, never>
  readonly removeExpired: (before: number) => Effect.Effect<string[], never>
  readonly createMatch: (match: Match) => Effect.Effect<Match, never>
  readonly getMatch: (matchId: string) => Effect.Effect<Option<Match>, never>
}

export const MatchmakingRepository = Context.Tag<MatchmakingRepository>()
