import { Effect } from 'effect'
import type {
  MatchEvent,
  PlayerTelemetry,
  ServerMetrics,
  TelemetryTimeRange,
  PlayerStatsAggregation,
} from '../entities/telemetry.entity'
import type { TelemetryError } from '../errors/telemetry.errors'

export interface TelemetryRepository {
  readonly recordMatchEvent: (event: MatchEvent) => Effect.Effect<void, TelemetryError>
  readonly recordPlayerTelemetry: (data: PlayerTelemetry) => Effect.Effect<void, TelemetryError>
  readonly recordServerMetrics: (data: ServerMetrics) => Effect.Effect<void, TelemetryError>
  readonly getMatchEvents: (matchId: string) => Effect.Effect<MatchEvent[], TelemetryError>
  readonly getPlayerTelemetry: (
    playerId: string,
    timeRange: TelemetryTimeRange
  ) => Effect.Effect<PlayerTelemetry[], TelemetryError>
  readonly getServerMetrics: (
    serverId: string,
    timeRange: TelemetryTimeRange
  ) => Effect.Effect<ServerMetrics[], TelemetryError>
  readonly getPlayerStatsAggregation: (
    playerId: string,
    timeRange: TelemetryTimeRange
  ) => Effect.Effect<PlayerStatsAggregation, TelemetryError>
}
