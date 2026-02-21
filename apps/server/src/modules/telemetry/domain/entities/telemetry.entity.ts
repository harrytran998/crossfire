export interface MatchEvent {
  readonly time: Date
  readonly matchId: string
  readonly eventType: string
  readonly sourcePlayerId?: string | undefined
  readonly targetPlayerId?: string | undefined
  readonly weaponId?: string | undefined
  readonly damageAmount?: number | undefined
  readonly hitZone?: string | undefined
  readonly positionX?: number | undefined
  readonly positionY?: number | undefined
  readonly positionZ?: number | undefined
  readonly roundNumber?: number | undefined
  readonly tickNumber?: number | undefined
  readonly metadata?: Record<string, unknown> | undefined
}

export interface PlayerTelemetry {
  readonly time: Date
  readonly playerId: string
  readonly matchId: string
  readonly kills: number
  readonly deaths: number
  readonly assists: number
  readonly damageDealt: bigint
  readonly damageReceived: bigint
  readonly score: number
  readonly pingMs?: number | undefined
  readonly fpsAvg?: number | undefined
  readonly packetLossPct?: number | undefined
}

export interface ServerMetrics {
  readonly time: Date
  readonly serverId: string
  readonly cpuPercent?: number | undefined
  readonly memoryMb?: bigint | undefined
  readonly connections?: number | undefined
  readonly bytesIn?: bigint | undefined
  readonly bytesOut?: bigint | undefined
  readonly activeRooms?: number | undefined
  readonly activePlayers?: number | undefined
  readonly tickRateAvg?: number | undefined
}

export interface TelemetryTimeRange {
  readonly start: Date
  readonly end: Date
}

export interface PlayerStatsAggregation {
  readonly playerId: string
  readonly totalKills: number
  readonly totalDeaths: number
  readonly totalAssists: number
  readonly totalDamageDealt: bigint
  readonly totalDamageReceived: bigint
  readonly averageScore: number
  readonly matchesPlayed: number
}
