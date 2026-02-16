import { Effect, ParseResult, Schema } from 'effect'
import { AuthService } from '../../../auth/application/services/auth.service'
import { MatchService } from '../../application/services/match.service'
import { MatchIdParamSchema, MatchListQuerySchema } from '../../domain/errors/match.errors'
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
      error: 'Invalid request',
      details: ParseResult.ArrayFormatter.formatErrorSync(error),
    },
    { status: HTTP_STATUS.BAD_REQUEST }
  )

const listMatchesHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const query = new URL(req.url).searchParams
  const decoded = Schema.decodeUnknownEither(MatchListQuerySchema)({
    page: query.get('page') ?? undefined,
    pageSize: query.get('pageSize') ?? undefined,
  })

  if (decoded._tag === 'Left') {
    return validationErrorResponse(decoded.left)
  }

  const page = decoded.right.page ?? 1
  const pageSize = decoded.right.pageSize ?? 20

  const result = await runApp(
    Effect.gen(function* () {
      const matchService = yield* MatchService
      return yield* matchService.listByUserId(auth.userId, page, pageSize)
    })
  )

  return Response.json(result)
}

const getMatchDetailHandler: RouteDefinition['handler'] = async (req, { params, runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const decoded = Schema.decodeUnknownEither(MatchIdParamSchema)({ matchId: params.matchId ?? '' })
  if (decoded._tag === 'Left') {
    return validationErrorResponse(decoded.left)
  }

  const match = await runApp(
    Effect.gen(function* () {
      const matchService = yield* MatchService
      return yield* matchService.getDetailByUserId(auth.userId, decoded.right.matchId)
    })
  )

  return Response.json({ match })
}

export const matchRoutes: readonly RouteDefinition[] = [
  { method: 'GET', path: '/api/matches', handler: listMatchesHandler },
  { method: 'GET', path: '/api/matches/:matchId', handler: getMatchDetailHandler },
]
