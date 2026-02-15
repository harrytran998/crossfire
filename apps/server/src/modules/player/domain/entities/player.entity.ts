import type { Players, PlayerStats as PlayerStatsRow, PlayerProgression as PlayerProgressionRow } from '@crossfire/database'

export type PlayerRow = Players
export type PlayerStatsDbType = PlayerStatsRow
export type PlayerProgressionDbType = PlayerProgressionRow

export interface Player {
  readonly id: string
  readonly userId: string
  readonly displayName: string
  readonly avatarUrl: string | null
  readonly bio: string | null
  readonly region: string
  readonly language: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface PlayerStats {
  readonly playerId: string
  readonly totalMatches: number
  readonly matchesWon: number
  readonly matchesLost: number
  readonly totalKills: bigint
  readonly totalDeaths: bigint
  readonly totalAssists: bigint
  readonly totalHeadshots: bigint
  readonly totalDamageDealt: bigint
  readonly totalDamageReceived: bigint
  readonly totalScore: bigint
  readonly playtimeSeconds: bigint
  readonly lastUpdated: Date
}

export interface PlayerProgression {
  readonly playerId: string
  readonly currentLevel: number
  readonly currentXp: bigint
  readonly totalXp: bigint
  readonly xpMultiplier: number
  readonly xpBoosterExpires: Date | null
  readonly lastUpdated: Date
}

export interface CreatePlayerInput {
  readonly userId: string
  readonly displayName: string
  readonly region?: string
  readonly language?: string
}

export interface UpdatePlayerInput {
  readonly displayName?: string
  readonly avatarUrl?: string
  readonly bio?: string
  readonly region?: string
  readonly language?: string
}

export const mapPlayerRowToEntity = (row: PlayerRow): Player => ({
  id: row.id as unknown as string,
  userId: row.user_id,
  displayName: row.display_name,
  avatarUrl: row.avatar_url,
  bio: row.bio,
  region: (row.region as unknown as string) ?? 'ASIA',
  language: (row.language as unknown as string) ?? 'en',
  createdAt: row.created_at as unknown as Date,
  updatedAt: row.updated_at as unknown as Date,
})

export const mapPlayerStatsRowToEntity = (row: PlayerStatsDbType): PlayerStats => ({
  playerId: row.player_id,
  totalMatches: row.total_matches as unknown as number,
  matchesWon: row.matches_won as unknown as number,
  matchesLost: row.matches_lost as unknown as number,
  totalKills: row.total_kills as unknown as bigint,
  totalDeaths: row.total_deaths as unknown as bigint,
  totalAssists: row.total_assists as unknown as bigint,
  totalHeadshots: row.total_headshots as unknown as bigint,
  totalDamageDealt: row.total_damage_dealt as unknown as bigint,
  totalDamageReceived: row.total_damage_received as unknown as bigint,
  totalScore: row.total_score as unknown as bigint,
  playtimeSeconds: row.playtime_seconds as unknown as bigint,
  lastUpdated: row.last_updated as unknown as Date,
})

export const mapPlayerProgressionRowToEntity = (row: PlayerProgressionDbType): PlayerProgression => ({
  playerId: row.player_id,
  currentLevel: row.current_level as unknown as number,
  currentXp: row.current_xp as unknown as bigint,
  totalXp: row.total_xp as unknown as bigint,
  xpMultiplier: parseFloat(row.xp_multiplier as unknown as string) || 1.0,
  xpBoosterExpires: row.xp_booster_expires as unknown as Date | null,
  lastUpdated: row.last_updated as unknown as Date,
})
