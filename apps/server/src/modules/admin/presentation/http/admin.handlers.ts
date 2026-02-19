import { Effect, Context } from 'effect'
import type { TelemetryService } from '../../../telemetry/application/services/telemetry.service'

export class AdminTelemetryServiceContext extends Context.Tag('AdminTelemetryServiceContext')<
  AdminTelemetryServiceContext,
  TelemetryService
>() {}

export const getAdminPlayerTelemetryHandler = (playerId: string, start: Date, end: Date): Effect.Effect<
  { status: number; body: unknown },
  never,
  AdminTelemetryServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* AdminTelemetryServiceContext
    const telemetry = yield* service.getPlayerTelemetry(playerId, { start, end })
    
    return {
      status: 200,
      body: { telemetry },
    }
  }).pipe(Effect.catchAll(() => Effect.succeed({ status: 500, body: { error: 'Internal server error' } })))

export const getAdminMatchEventsHandler = (matchId: string): Effect.Effect<
  { status: number; body: unknown },
  never,
  AdminTelemetryServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* AdminTelemetryServiceContext
    const events = yield* service.getMatchEvents(matchId)
    
    return {
      status: 200,
      body: { events },
    }
  }).pipe(Effect.catchAll(() => Effect.succeed({ status: 500, body: { error: 'Internal server error' } })))

export const getAdminServerMetricsHandler = (serverId: string, start: Date, end: Date): Effect.Effect<
  { status: number; body: unknown },
  never,
  AdminTelemetryServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* AdminTelemetryServiceContext
    const metrics = yield* service.getServerMetrics(serverId, { start, end })
    
    return {
      status: 200,
      body: { metrics },
    }
  }).pipe(Effect.catchAll(() => Effect.succeed({ status: 500, body: { error: 'Internal server error' } })))

export const getAdminAggregatedStatsHandler = (playerId: string, start: Date, end: Date): Effect.Effect<
  { status: number; body: unknown },
  never,
  AdminTelemetryServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* AdminTelemetryServiceContext
    const stats = yield* service.getPlayerStats(playerId, { start, end })
    
    return {
      status: 200,
      body: { stats },
    }
  }).pipe(Effect.catchAll(() => Effect.succeed({ status: 500, body: { error: 'Internal server error' } })))
