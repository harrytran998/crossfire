import { Context, Effect, Layer } from 'effect'
import type {
  MatchEvent,
  PlayerTelemetry,
  ServerMetrics,
  TelemetryTimeRange,
  PlayerStatsAggregation,
} from '../../domain/entities/telemetry.entity'
import { TelemetryError } from '../../domain/errors/telemetry.errors'
import {
  TelemetryRepository,
  TelemetryRepositoryLive,
} from '../../infrastructure/repositories/telemetry.repository.impl'

export interface TelemetryService {
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
  readonly getPlayerStats: (
    playerId: string,
    timeRange: TelemetryTimeRange
  ) => Effect.Effect<PlayerStatsAggregation, TelemetryError>
}

export const TelemetryService = Context.GenericTag<TelemetryService>('TelemetryService')

export const TelemetryServiceLive = Layer.effect(
  TelemetryService,
  Effect.gen(function* () {
    const repo = yield* TelemetryRepository

    const recordMatchEvent = (event: MatchEvent) => repo.recordMatchEvent(event)

    const recordPlayerTelemetry = (data: PlayerTelemetry) => repo.recordPlayerTelemetry(data)

    const recordServerMetrics = (data: ServerMetrics) => repo.recordServerMetrics(data)

    const getMatchEvents = (matchId: string) => repo.getMatchEvents(matchId)

    const getPlayerTelemetry = (playerId: string, timeRange: TelemetryTimeRange) =>
      repo.getPlayerTelemetry(playerId, timeRange)

    const getServerMetrics = (serverId: string, timeRange: TelemetryTimeRange) =>
      repo.getServerMetrics(serverId, timeRange)

    const getPlayerStats = (playerId: string, timeRange: TelemetryTimeRange) =>
      repo.getPlayerStatsAggregation(playerId, timeRange)

    return TelemetryService.of({
      recordMatchEvent,
      recordPlayerTelemetry,
      recordServerMetrics,
      getMatchEvents,
      getPlayerTelemetry,
      getServerMetrics,
      getPlayerStats,
    })
  })
).pipe(Layer.provide(TelemetryRepositoryLive))
