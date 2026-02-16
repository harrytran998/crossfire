import { Effect, ParseResult, Schema } from 'effect'
import { AuthService } from '../../../auth/application/services/auth.service'
import { LoadoutService } from '../../application/services/loadout.service'
import {
  CreateLoadoutSchema,
  LoadoutIdParamSchema,
  UpdateLoadoutSchema,
} from '../../domain/errors/loadout.errors'
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
      error: 'Invalid request',
      details: ParseResult.ArrayFormatter.formatErrorSync(error),
    },
    { status: HTTP_STATUS.BAD_REQUEST }
  )

const listLoadoutsHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const loadouts = await runApp(
    Effect.gen(function* () {
      const loadoutService = yield* LoadoutService
      return yield* loadoutService.listByUserId(auth.userId)
    })
  )

  return Response.json({ loadouts })
}

const createLoadoutHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const parsed = await parseJsonObject(req)
  if (!parsed.ok) return parsed.response

  const decoded = Schema.decodeUnknownEither(CreateLoadoutSchema)(parsed.body)
  if (decoded._tag === 'Left') {
    return validationErrorResponse(decoded.left)
  }

  const loadout = await runApp(
    Effect.gen(function* () {
      const loadoutService = yield* LoadoutService
      return yield* loadoutService.createForUser(auth.userId, decoded.right)
    })
  )

  return Response.json({ loadout }, { status: HTTP_STATUS.CREATED })
}

const updateLoadoutHandler: RouteDefinition['handler'] = async (req, { params, runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const decodedParams = Schema.decodeUnknownEither(LoadoutIdParamSchema)({
    loadoutId: params.loadoutId ?? '',
  })
  if (decodedParams._tag === 'Left') {
    return validationErrorResponse(decodedParams.left)
  }

  const parsed = await parseJsonObject(req)
  if (!parsed.ok) return parsed.response

  const decoded = Schema.decodeUnknownEither(UpdateLoadoutSchema)(parsed.body)
  if (decoded._tag === 'Left') {
    return validationErrorResponse(decoded.left)
  }

  const loadout = await runApp(
    Effect.gen(function* () {
      const loadoutService = yield* LoadoutService
      return yield* loadoutService.updateForUser(auth.userId, decodedParams.right.loadoutId, decoded.right)
    })
  )

  return Response.json({ loadout })
}

const deleteLoadoutHandler: RouteDefinition['handler'] = async (req, { params, runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const decodedParams = Schema.decodeUnknownEither(LoadoutIdParamSchema)({
    loadoutId: params.loadoutId ?? '',
  })
  if (decodedParams._tag === 'Left') {
    return validationErrorResponse(decodedParams.left)
  }

  await runApp(
    Effect.gen(function* () {
      const loadoutService = yield* LoadoutService
      yield* loadoutService.removeForUser(auth.userId, decodedParams.right.loadoutId)
    })
  )

  return Response.json({ success: true })
}

export const loadoutRoutes: readonly RouteDefinition[] = [
  { method: 'GET', path: '/api/loadouts', handler: listLoadoutsHandler },
  { method: 'POST', path: '/api/loadouts', handler: createLoadoutHandler },
  { method: 'PUT', path: '/api/loadouts/:loadoutId', handler: updateLoadoutHandler },
  { method: 'DELETE', path: '/api/loadouts/:loadoutId', handler: deleteLoadoutHandler },
]
