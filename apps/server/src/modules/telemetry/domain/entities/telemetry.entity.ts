export interface MatchEvent {
  readonly time: Date
  readonly matchId: string
  readonly eventType: string
  readonly sourcePlayerId?: string
  readonly targetPlayerId?: string
  readonly weaponId?: string
  readonly damageAmount?: number
  readonly hitZone?: string
  readonly positionX?: number
  readonly positionY?: number
  readonly positionZ?: number
  readonly roundNumber?: number
  readonly tickNumber?: number
  readonly metadata?: Record<string, unknown>
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
  readonly pingMs?: number
  readonly fpsAvg?: number
  readonly packetLossPct?: number
}

export interface ServerMetrics {
  readonly time: Date
  readonly serverId: string
  readonly cpuPercent?: number
  readonly memoryMb?: bigint
  readonly connections?: number
  readonly bytesIn?: bigint
  readonly bytesOut?: bigint
  readonly activeRooms?: number
  readonly activePlayers?: number
  readonly tickRateAvg?: number
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
