import type { GameMode, LeaderboardPeriod } from '@crossfire/database'
import type { Effect } from 'effect'
import type { LeaderboardResult } from '../entities/leaderboard.entity'

export interface LeaderboardFilters {
  readonly metricKey?: string
  readonly period?: LeaderboardPeriod
  readonly mode?: GameMode
}

export interface LeaderboardRepository {
  readonly getLeaderboard: (
    playerId: string,
    filters: LeaderboardFilters,
    page: number,
    pageSize: number,
    includePlayerRank: boolean
  ) => Effect.Effect<readonly LeaderboardResult[]>
}
