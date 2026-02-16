import type { MatchParticipants, Matches } from '@crossfire/database'

export type MatchRow = Matches
export type MatchParticipantRow = MatchParticipants

export interface MatchSummary {
  readonly id: string
  readonly gameMode: string
  readonly mapId: string
  readonly mapName: string
  readonly startedAt: Date
  readonly completedAt: Date
  readonly durationSeconds: number
  readonly winningTeam: number | null
  readonly score: number
  readonly kills: number
  readonly deaths: number
  readonly assists: number
  readonly isWinner: boolean
}

export interface MatchParticipant {
  readonly playerId: string
  readonly team: number | null
  readonly score: number
  readonly kills: number
  readonly deaths: number
  readonly assists: number
  readonly headshots: number
  readonly damageDealt: bigint
  readonly damageReceived: bigint
  readonly isWinner: boolean
  readonly position: number | null
  readonly xpGained: number
}

export interface MatchDetail {
  readonly id: string
  readonly gameMode: string
  readonly mapId: string
  readonly mapName: string
  readonly startedAt: Date
  readonly completedAt: Date
  readonly durationSeconds: number
  readonly winningTeam: number | null
  readonly participants: readonly MatchParticipant[]
}

export interface MatchPage {
  readonly items: readonly MatchSummary[]
  readonly total: number
  readonly page: number
  readonly pageSize: number
}
