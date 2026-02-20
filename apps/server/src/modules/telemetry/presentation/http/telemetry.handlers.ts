import { Effect, Context } from 'effect'
import type { TelemetryService } from '../../application/services/telemetry.service'
import { CurrentAuth } from '../../../auth/presentation/http/auth.routes'
import { ForbiddenError } from '../../../auth/domain/errors/auth.errors'

export class TelemetryServiceContext extends Context.Tag('TelemetryServiceContext')<
  TelemetryServiceContext,
  TelemetryService
>() {}

const MAX_DATE_RANGE_MS = 90 * 24 * 60 * 60 * 1000

const validateDateRange = (start: Date, end: Date): Effect.Effect<void, ForbiddenError> => {
  const rangeMs = end.getTime() - start.getTime()
  if (rangeMs < 0) {
    return Effect.fail(
      new ForbiddenError({ message: 'Invalid date range: start must be before end' })
    )
  }
  if (rangeMs > MAX_DATE_RANGE_MS) {
    return Effect.fail(new ForbiddenError({ message: `Date range too large. Maximum: 90 days` }))
  }
  return Effect.succeed(void 0)
}

export const getPlayerTelemetryHandler = (
  playerId: string,
  start: Date,
  end: Date
): Effect.Effect<{ status: number; body: unknown }, never, TelemetryServiceContext | CurrentAuth> =>
  Effect.gen(function* () {
    const { user } = yield* CurrentAuth

    if (user.id !== playerId && user.role !== 'admin') {
      return yield* Effect.fail(
        new ForbiddenError({ message: 'Can only access your own telemetry' })
      )
    }

    yield* validateDateRange(start, end)

    const service = yield* TelemetryServiceContext
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

export const getMatchEventsHandler = (
  matchId: string
): Effect.Effect<{ status: number; body: unknown }, never, TelemetryServiceContext | CurrentAuth> =>
  Effect.gen(function* () {
    const { user } = yield* CurrentAuth

    // Only admins can access match events (sensitive data)
    if (user.role !== 'admin') {
      return yield* Effect.fail(new ForbiddenError({ message: 'Admin access required' }))
    }

    const service = yield* TelemetryServiceContext
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

export const getServerMetricsHandler = (
  serverId: string,
  start: Date,
  end: Date
): Effect.Effect<{ status: number; body: unknown }, never, TelemetryServiceContext | CurrentAuth> =>
  Effect.gen(function* () {
    const { user } = yield* CurrentAuth

    if (user.role !== 'admin') {
      return yield* Effect.fail(new ForbiddenError({ message: 'Admin access required' }))
    }

    yield* validateDateRange(start, end)

    const service = yield* TelemetryServiceContext
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

export const getPlayerStatsHandler = (
  playerId: string,
  start: Date,
  end: Date
): Effect.Effect<{ status: number; body: unknown }, never, TelemetryServiceContext | CurrentAuth> =>
  Effect.gen(function* () {
    const { user } = yield* CurrentAuth

    if (user.id !== playerId && user.role !== 'admin') {
      return yield* Effect.fail(new ForbiddenError({ message: 'Can only access your own stats' }))
    }

    yield* validateDateRange(start, end)

    const service = yield* TelemetryServiceContext
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
