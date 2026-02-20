import { Effect, Schema } from 'effect'
import type { RouteDefinition } from '../../../../http/radix-router'
import { HTTP_STATUS } from '../../../../http/status'
import { errorResponse } from '../../../../http/response'
import { extractBearerToken, parseJsonObject } from '../../../../http/request'
import { AuthService } from '../../../auth/application/services/auth.service'
import { MatchmakingServiceTag } from '../../application/services/matchmaking.service'

const JoinQueueSchema = Schema.Struct({
  gameMode: Schema.String,
  skillRating: Schema.Number,
})

const requireAuthUser = async (
  req: Request,
  runApp: <A, E, R>(effect: Effect.Effect<A, E, R>) => Promise<A>
): Promise<{ userId: string } | Response> => {
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

  return { userId: authSession.user.id }
}

const joinQueueHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const parsed = await parseJsonObject(req)
  if (!parsed.ok) return parsed.response

  const decoded = Schema.decodeUnknownEither(JoinQueueSchema)(parsed.body)
  if (decoded._tag === 'Left') {
    return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Invalid request body')
  }

  const body = decoded.right

  const ticket = await runApp(
    Effect.gen(function* () {
      const service = yield* MatchmakingServiceTag
      return yield* service.joinQueue({
        playerId: auth.userId,
        gameMode: body.gameMode,
        skillRating: body.skillRating,
      })
    })
  )

  return Response.json(
    {
      ticketId: ticket.id,
      status: ticket.status,
      queuedAt: ticket.queuedAt,
    },
    { status: HTTP_STATUS.CREATED }
  )
}

const leaveQueueHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  await runApp(
    Effect.gen(function* () {
      const service = yield* MatchmakingServiceTag
      yield* service.leaveQueue(auth.userId)
    })
  )

  return Response.json({ message: 'Left queue successfully' })
}

const getQueueStatusHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const status = await runApp(
    Effect.gen(function* () {
      const service = yield* MatchmakingServiceTag
      return yield* service.getQueueStatus(auth.userId)
    })
  )

  if (!status) {
    return Response.json({ error: 'Not in queue' }, { status: HTTP_STATUS.NOT_FOUND })
  }

  return Response.json(status)
}

export const matchmakingRoutes: readonly RouteDefinition[] = [
  { method: 'POST', path: '/api/matchmaking/queue', handler: joinQueueHandler },
  { method: 'DELETE', path: '/api/matchmaking/queue', handler: leaveQueueHandler },
  { method: 'GET', path: '/api/matchmaking/status', handler: getQueueStatusHandler },
]
