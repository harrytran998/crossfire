import type { GameMode, LeaderboardPeriod } from '@crossfire/database'

export interface LeaderboardEntry {
  readonly rank: number
  readonly playerId: string
  readonly displayName: string
  readonly value: bigint
  readonly matchesCount: number
}

export interface LeaderboardEntryView {
  readonly leaderboardId: string
  readonly metricKey: string
  readonly periodType: LeaderboardPeriod
  readonly gameMode: GameMode | null
  readonly rank: number
  readonly playerId: string
  readonly displayName: string
  readonly value: bigint
  readonly matchesCount: number
  readonly periodStart: Date
  readonly periodEnd: Date
}

export interface LeaderboardPlayerRank {
  readonly leaderboardId: string
  readonly metricKey: string
  readonly periodType: LeaderboardPeriod
  readonly gameMode: GameMode | null
  readonly rank: number
  readonly value: bigint
  readonly matchesCount: number
}

export interface LeaderboardResult {
  readonly metricKey: string
  readonly period: LeaderboardPeriod
  readonly mode: GameMode | null
  readonly entries: readonly LeaderboardEntry[]
  readonly playerRank: {
    readonly rank: number
    readonly value: bigint
  } | null
}
