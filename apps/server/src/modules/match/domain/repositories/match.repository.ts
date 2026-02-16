import type { Effect } from 'effect'
import type { MatchDetail, MatchPage } from '../entities/match.entity'

export interface MatchRepository {
  readonly listByPlayerId: (
    playerId: string,
    page: number,
    pageSize: number
  ) => Effect.Effect<MatchPage>
  readonly getDetailByPlayerId: (
    playerId: string,
    matchId: string
  ) => Effect.Effect<MatchDetail | null>
}
