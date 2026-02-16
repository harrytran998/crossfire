import { Effect, ParseResult, Schema } from 'effect'
import { InventoryService } from '../../application/services/inventory.service'
import { AuthService } from '../../../auth/application/services/auth.service'
import { AuthThrottleService } from '../../../auth/application/services/auth-throttle.service'
import { AcquireInventorySchema } from '../../domain/errors/inventory.errors'
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

const listInventoryHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const items = await runApp(
    Effect.gen(function* () {
      const inventory = yield* InventoryService
      return yield* inventory.listByUserId(auth.userId)
    })
  )

  return Response.json({ items })
}

const acquireInventoryHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const rateLimit = await runApp(
    Effect.gen(function* () {
      const throttle = yield* AuthThrottleService
      return yield* throttle.consumeApiRateLimit('inventory-acquire', auth.userId)
    })
  )

  if (!rateLimit.allowed) {
    return Response.json(
      { error: 'Too many requests, please try again later' },
      {
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      }
    )
  }

  const parsed = await parseJsonObject(req)
  if (!parsed.ok) return parsed.response

  const decoded = Schema.decodeUnknownEither(AcquireInventorySchema)(parsed.body)
  if (decoded._tag === 'Left') {
    return validationErrorResponse(decoded.left)
  }

  const item = await runApp(
    Effect.gen(function* () {
      const inventory = yield* InventoryService
      return yield* inventory.acquireForUser(auth.userId, {
        weaponId: decoded.right.weaponId,
        isPermanent: decoded.right.isPermanent,
        expiresAt: decoded.right.expiresAt ?? null,
      })
    })
  )

  return Response.json({ item }, { status: HTTP_STATUS.CREATED })
}

export const inventoryRoutes: readonly RouteDefinition[] = [
  { method: 'GET', path: '/api/inventory', handler: listInventoryHandler },
  { method: 'POST', path: '/api/inventory/acquire', handler: acquireInventoryHandler },
]
