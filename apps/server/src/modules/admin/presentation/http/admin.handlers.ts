import { Effect, Context } from 'effect'
import type { TelemetryService } from '../../../telemetry/application/services/telemetry.service'
import { CurrentAuth } from '../../../auth/presentation/http/auth.routes'
import { ForbiddenError } from '../../../auth/domain/errors/auth.errors'

export class AdminTelemetryServiceContext extends Context.Tag('AdminTelemetryServiceContext')<
  AdminTelemetryServiceContext,
  TelemetryService
>() {}

const MAX_DATE_RANGE_MS = 90 * 24 * 60 * 60 * 1000

const validateDateRange = (start: Date, end: Date): Effect.Effect<void, ForbiddenError> => {
  const rangeMs = end.getTime() - start.getTime()
  if (rangeMs < 0) {
    return Effect.fail(new ForbiddenError({ message: 'Invalid date range: start must be before end' }))
  }
  if (rangeMs > MAX_DATE_RANGE_MS) {
    return Effect.fail(new ForbiddenError({ message: `Date range too large. Maximum: 90 days` }))
  }
  return Effect.succeed(void 0)
}

const requireAdmin = (): Effect.Effect<void, ForbiddenError, CurrentAuth> =>
  Effect.gen(function* () {
    const { user } = yield* CurrentAuth
    if (user.role !== 'admin') {
      return yield* Effect.fail(
        new ForbiddenError({ message: 'Admin access required' })
      )
    }
  })

export const getAdminPlayerTelemetryHandler = (playerId: string, start: Date, end: Date): Effect.Effect<
  { status: number; body: unknown },
  never,
  AdminTelemetryServiceContext | CurrentAuth
> =>
  Effect.gen(function* () {
    yield* requireAdmin()
    yield* validateDateRange(start, end)

    const service = yield* AdminTelemetryServiceContext
    const telemetry = yield* service.getPlayerTelemetry(playerId, { start, end })

    return {
      status: 200,
      body: { telemetry },
    }
  }).pipe(
    Effect.catchAll((error) => {
      if (error instanceof ForbiddenError) {
        return Effect.succeed({ status: 403, body: { error: error.message } })
      }
      return Effect.succeed({ status: 500, body: { error: 'Internal server error' } })
    })
  )

export const getAdminMatchEventsHandler = (matchId: string): Effect.Effect<
  { status: number; body: unknown },
  never,
  AdminTelemetryServiceContext | CurrentAuth
> =>
  Effect.gen(function* () {
    yield* requireAdmin()

    const service = yield* AdminTelemetryServiceContext
    const events = yield* service.getMatchEvents(matchId)

    return {
      status: 200,
      body: { events },
    }
  }).pipe(
    Effect.catchAll((error) => {
      if (error instanceof ForbiddenError) {
        return Effect.succeed({ status: 403, body: { error: error.message } })
      }
      return Effect.succeed({ status: 500, body: { error: 'Internal server error' } })
    })
  )

export const getAdminServerMetricsHandler = (serverId: string, start: Date, end: Date): Effect.Effect<
  { status: number; body: unknown },
  never,
  AdminTelemetryServiceContext | CurrentAuth
> =>
  Effect.gen(function* () {
    yield* requireAdmin()
    yield* validateDateRange(start, end)

    const service = yield* AdminTelemetryServiceContext
    const metrics = yield* service.getServerMetrics(serverId, { start, end })

    return {
      status: 200,
      body: { metrics },
    }
  }).pipe(
    Effect.catchAll((error) => {
      if (error instanceof ForbiddenError) {
        return Effect.succeed({ status: 403, body: { error: error.message } })
      }
      return Effect.succeed({ status: 500, body: { error: 'Internal server error' } })
    })
  )

export const getAdminAggregatedStatsHandler = (playerId: string, start: Date, end: Date): Effect.Effect<
  { status: number; body: unknown },
  never,
  AdminTelemetryServiceContext | CurrentAuth
> =>
  Effect.gen(function* () {
    yield* requireAdmin()
    yield* validateDateRange(start, end)

    const service = yield* AdminTelemetryServiceContext
    const stats = yield* service.getPlayerStats(playerId, { start, end })

    return {
      status: 200,
      body: { stats },
    }
  }).pipe(
    Effect.catchAll((error) => {
      if (error instanceof ForbiddenError) {
        return Effect.succeed({ status: 403, body: { error: error.message } })
      }
      return Effect.succeed({ status: 500, body: { error: 'Internal server error' } })
    })
  )
