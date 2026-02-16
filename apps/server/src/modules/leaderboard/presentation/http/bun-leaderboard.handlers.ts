import { Effect, ParseResult, Schema } from 'effect'
import { AuthService } from '../../../auth/application/services/auth.service'
import { LeaderboardService } from '../../application/services/leaderboard.service'
import { LeaderboardQuerySchema } from '../../domain/errors/leaderboard.errors'
import { errorResponse } from '../../../../http/response'
import { extractBearerToken } from '../../../../http/request'
import type { RouteDefinition } from '../../../../http/radix-router'
import { HTTP_STATUS } from '../../../../http/status'

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

const validationErrorResponse = (error: ParseResult.ParseError): Response =>
  Response.json(
    {
      error: 'Invalid query params',
      details: ParseResult.ArrayFormatter.formatErrorSync(error),
    },
    { status: HTTP_STATUS.BAD_REQUEST }
  )

const listLeaderboardHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const url = new URL(req.url)
  const decodedQuery = Schema.decodeUnknownEither(LeaderboardQuerySchema)({
    metricKey: url.searchParams.get('metricKey') ?? undefined,
    period: url.searchParams.get('period') ?? undefined,
    mode: url.searchParams.get('mode') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
    pageSize: url.searchParams.get('pageSize') ?? undefined,
    includeCurrentPlayerRank: url.searchParams.get('includeCurrentPlayerRank') ?? undefined,
  })

  if (decodedQuery._tag === 'Left') {
    return validationErrorResponse(decodedQuery.left)
  }

  const query = decodedQuery.right
  const leaderboards = await runApp(
    Effect.gen(function* () {
      const leaderboardService = yield* LeaderboardService
      return yield* leaderboardService.getForUser(auth.userId, {
        metricKey: query.metricKey,
        period: query.period,
        mode: query.mode,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
        includeCurrentPlayerRank: query.includeCurrentPlayerRank ?? false,
      })
    })
  )

  return Response.json({ leaderboards })
}

export const leaderboardRoutes: readonly RouteDefinition[] = [
  { method: 'GET', path: '/api/leaderboards', handler: listLeaderboardHandler },
]
