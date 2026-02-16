import { Effect, ParseResult, Schema } from 'effect'
import { PlayerService } from '../../application/services/player.service'
import { AuthService } from '../../../auth/application/services/auth.service'
import { CreatePlayerSchema, UpdatePlayerSchema } from '../../domain/errors/player.errors'
import { errorResponse } from '../../../../http/response'
import { extractBearerToken, parseJsonObject } from '../../../../http/request'
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
      error: 'Invalid request body',
      details: ParseResult.ArrayFormatter.formatErrorSync(error),
    },
    { status: HTTP_STATUS.BAD_REQUEST }
  )

const createProfileHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const parsed = await parseJsonObject(req)
  if (!parsed.ok) return parsed.response

  const decoded = Schema.decodeUnknownEither(CreatePlayerSchema)(parsed.body)
  if (decoded._tag === 'Left') {
    return validationErrorResponse(decoded.left)
  }

  const body = decoded.right
  const player = await runApp(
    Effect.gen(function* () {
      const playerService = yield* PlayerService
      return yield* playerService.createProfile({
        userId: auth.userId,
        displayName: body.displayName,
        region: body.region,
        language: body.language,
      })
    })
  )

  return Response.json({ player }, { status: HTTP_STATUS.CREATED })
}

const getProfileHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const player = await runApp(
    Effect.gen(function* () {
      const playerService = yield* PlayerService
      return yield* playerService.getProfileByUserId(auth.userId)
    })
  )

  return Response.json({ player })
}

const updateProfileHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const parsed = await parseJsonObject(req)
  if (!parsed.ok) return parsed.response

  const decoded = Schema.decodeUnknownEither(UpdatePlayerSchema)(parsed.body)
  if (decoded._tag === 'Left') {
    return validationErrorResponse(decoded.left)
  }

  const body = decoded.right
  const player = await runApp(
    Effect.gen(function* () {
      const playerService = yield* PlayerService
      return yield* playerService.updateProfile(auth.userId, {
        displayName: body.displayName,
        avatarUrl: body.avatarUrl,
        bio: body.bio,
        region: body.region,
        language: body.language,
      })
    })
  )

  return Response.json({ player })
}

const getStatsHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const stats = await runApp(
    Effect.gen(function* () {
      const playerService = yield* PlayerService
      return yield* playerService.getStatsByUserId(auth.userId)
    })
  )

  return Response.json({ stats })
}

const getProgressionHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const progression = await runApp(
    Effect.gen(function* () {
      const playerService = yield* PlayerService
      return yield* playerService.getProgressionByUserId(auth.userId)
    })
  )

  return Response.json({ progression })
}

export const playerRoutes: readonly RouteDefinition[] = [
  { method: 'POST', path: '/api/players/me', handler: createProfileHandler },
  { method: 'GET', path: '/api/players/me', handler: getProfileHandler },
  { method: 'PATCH', path: '/api/players/me', handler: updateProfileHandler },
  { method: 'GET', path: '/api/players/me/stats', handler: getStatsHandler },
  { method: 'GET', path: '/api/players/me/progression', handler: getProgressionHandler },
]
