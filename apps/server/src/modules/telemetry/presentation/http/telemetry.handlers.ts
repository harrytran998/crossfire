import { Effect, Context } from 'effect'
import type { TelemetryService } from '../../application/services/telemetry.service'

export class TelemetryServiceContext extends Context.Tag('TelemetryServiceContext')<
  TelemetryServiceContext,
  TelemetryService
>() {}

export const getPlayerTelemetryHandler = (playerId: string, start: Date, end: Date): Effect.Effect<
  { status: number; body: unknown },
  never,
  TelemetryServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* TelemetryServiceContext
    const telemetry = yield* service.getPlayerTelemetry(playerId, { start, end })
    
    return {
      status: 200,
      body: { telemetry },
    }
  }).pipe(Effect.catchAll(() => Effect.succeed({ status: 500, body: { error: 'Internal server error' } })))

export const getMatchEventsHandler = (matchId: string): Effect.Effect<
  { status: number; body: unknown },
  never,
  TelemetryServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* TelemetryServiceContext
    const events = yield* service.getMatchEvents(matchId)
    
    return {
      status: 200,
      body: { events },
    }
  }).pipe(Effect.catchAll(() => Effect.succeed({ status: 500, body: { error: 'Internal server error' } })))

export const getServerMetricsHandler = (serverId: string, start: Date, end: Date): Effect.Effect<
  { status: number; body: unknown },
  never,
  TelemetryServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* TelemetryServiceContext
    const metrics = yield* service.getServerMetrics(serverId, { start, end })
    
    return {
      status: 200,
      body: { metrics },
    }
  }).pipe(Effect.catchAll(() => Effect.succeed({ status: 500, body: { error: 'Internal server error' } })))

export const getPlayerStatsHandler = (playerId: string, start: Date, end: Date): Effect.Effect<
  { status: number; body: unknown },
  never,
  TelemetryServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* TelemetryServiceContext
    const stats = yield* service.getPlayerStats(playerId, { start, end })
    
    return {
      status: 200,
      body: { stats },
    }
  }).pipe(Effect.catchAll(() => Effect.succeed({ status: 500, body: { error: 'Internal server error' } })))
