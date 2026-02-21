import { Effect } from 'effect'
import type { RouteDefinition } from '../../../../http/radix-router'
import { HTTP_STATUS } from '../../../../http/status'
import { errorResponse } from '../../../../http/response'
import { extractBearerToken } from '../../../../http/request'
import { AuthService } from '../../../auth/application/services/auth.service'
import { TelemetryService } from '../../application/services/telemetry.service'

const MAX_DATE_RANGE_MS = 90 * 24 * 60 * 60 * 1000

const requireAuthUser = async (
  req: Request,
  runApp: <A, E, R>(effect: Effect.Effect<A, E, R>) => Promise<A>
): Promise<{ userId: string; role: string } | Response> => {
  const token = extractBearerToken(req)
  if (!token) {
    return errorResponse(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized')
  }

  const authSession = await runApp(
    Effect.gen(function* () {
      const auth = yield* AuthService
      return yield* auth.validateSession(token)
    })
  )

  return { userId: authSession.user.id, role: authSession.user.role }
}

const parseDateRange = (url: URL): { start: Date; end: Date } | Response => {
  const startParam = url.searchParams.get('start')
  const endParam = url.searchParams.get('end')

  if (!startParam || !endParam) {
    return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Start and end dates are required')
  }

  const start = new Date(startParam)
  const end = new Date(endParam)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Invalid date format')
  }

  const rangeMs = end.getTime() - start.getTime()
  if (rangeMs < 0) {
    return errorResponse(HTTP_STATUS.BAD_REQUEST, 'End date must be after start date')
  }
  if (rangeMs > MAX_DATE_RANGE_MS) {
    return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Date range too large. Maximum: 90 days')
  }

  return { start, end }
}

const getPlayerTelemetryHandler: RouteDefinition['handler'] = async (req, { runApp, params }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const playerId = params?.playerId
  if (!playerId) {
    return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Player ID is required')
  }

  if (auth.userId !== playerId && auth.role !== 'admin') {
    return errorResponse(HTTP_STATUS.FORBIDDEN, 'Can only access your own telemetry')
  }

  const url = new URL(req.url)
  const dateRange = parseDateRange(url)
  if (dateRange instanceof Response) {
    return dateRange
  }

  const telemetry = await runApp(
    Effect.gen(function* () {
      const service = yield* TelemetryService
      return yield* service.getPlayerTelemetry(playerId, dateRange)
    })
  )

  return Response.json({ telemetry })
}

const getMatchEventsHandler: RouteDefinition['handler'] = async (req, { runApp, params }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  if (auth.role !== 'admin') {
    return errorResponse(HTTP_STATUS.FORBIDDEN, 'Admin access required')
  }

  const matchId = params?.matchId
  if (!matchId) {
    return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Match ID is required')
  }

  const events = await runApp(
    Effect.gen(function* () {
      const service = yield* TelemetryService
      return yield* service.getMatchEvents(matchId)
    })
  )

  return Response.json({ events })
}

const getServerMetricsHandler: RouteDefinition['handler'] = async (req, { runApp, params }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  if (auth.role !== 'admin') {
    return errorResponse(HTTP_STATUS.FORBIDDEN, 'Admin access required')
  }

  const serverId = params?.serverId
  if (!serverId) {
    return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Server ID is required')
  }

  const url = new URL(req.url)
  const dateRange = parseDateRange(url)
  if (dateRange instanceof Response) {
    return dateRange
  }

  const metrics = await runApp(
    Effect.gen(function* () {
      const service = yield* TelemetryService
      return yield* service.getServerMetrics(serverId, dateRange)
    })
  )

  return Response.json({ metrics })
}

const getPlayerStatsHandler: RouteDefinition['handler'] = async (req, { runApp, params }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const playerId = params?.playerId
  if (!playerId) {
    return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Player ID is required')
  }

  if (auth.userId !== playerId && auth.role !== 'admin') {
    return errorResponse(HTTP_STATUS.FORBIDDEN, 'Can only access your own stats')
  }

  const url = new URL(req.url)
  const dateRange = parseDateRange(url)
  if (dateRange instanceof Response) {
    return dateRange
  }

  const stats = await runApp(
    Effect.gen(function* () {
      const service = yield* TelemetryService
      return yield* service.getPlayerStats(playerId, dateRange)
    })
  )

  return Response.json({ stats })
}

export const telemetryRoutes: readonly RouteDefinition[] = [
  { method: 'GET', path: '/api/telemetry/player/:playerId', handler: getPlayerTelemetryHandler },
  { method: 'GET', path: '/api/telemetry/match/:matchId', handler: getMatchEventsHandler },
  { method: 'GET', path: '/api/telemetry/server/:serverId', handler: getServerMetricsHandler },
  { method: 'GET', path: '/api/telemetry/stats/:playerId', handler: getPlayerStatsHandler },
]
