import { Effect, ParseResult, Schema } from 'effect'
import { AuthService } from '../../application/services/auth.service'
import { AuthThrottleService } from '../../application/services/auth-throttle.service'
import { BetterAuthConfig } from '../../infrastructure/adapters/better-auth.config'
import type { AuthResult } from '../../domain/entities/user.entity'
import { LoginSchema, RegistrationSchema } from '../../domain/errors/auth.errors'
import { errorResponse } from '../../../../http/response'
import { extractBearerToken, getClientIp, parseJsonObject } from '../../../../http/request'
import type { RouteDefinition } from '../../../../http/radix-router'
import { HTTP_STATUS } from '../../../../http/status'

const getSessionContext = (req: Request) => ({
  ipAddress: getClientIp(req),
  userAgent: req.headers.get('user-agent'),
})

const validationErrorResponse = (error: ParseResult.ParseError): Response =>
  Response.json(
    {
      error: 'Invalid request body',
      details: ParseResult.ArrayFormatter.formatErrorSync(error),
    },
    { status: HTTP_STATUS.BAD_REQUEST }
  )

const registerHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const sessionContext = getSessionContext(req)

  const rateLimit = await runApp(
    Effect.gen(function* () {
      const authThrottle = yield* AuthThrottleService
      return yield* authThrottle.consumeAuthRateLimit('register', sessionContext.ipAddress)
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

  const decoded = Schema.decodeUnknownEither(RegistrationSchema)(parsed.body)
  if (decoded._tag === 'Left') {
    return validationErrorResponse(decoded.left)
  }

  const body = decoded.right
  const result = await runApp(
    Effect.gen(function* () {
      const auth = yield* AuthService
      return yield* auth.register(
        {
          email: body.email,
          username: body.username,
          password: body.password,
        },
        sessionContext
      )
    })
  )

  return Response.json(
    {
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
      },
      token: result.token,
    },
    { status: HTTP_STATUS.CREATED }
  )
}

const loginHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const sessionContext = getSessionContext(req)

  const rateLimit = await runApp(
    Effect.gen(function* () {
      const authThrottle = yield* AuthThrottleService
      return yield* authThrottle.consumeAuthRateLimit('login', sessionContext.ipAddress)
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

  const decoded = Schema.decodeUnknownEither(LoginSchema)(parsed.body)
  if (decoded._tag === 'Left') {
    return validationErrorResponse(decoded.left)
  }

  const body = decoded.right
  const lockout = await runApp(
    Effect.gen(function* () {
      const authThrottle = yield* AuthThrottleService
      return yield* authThrottle.getLoginLockout(sessionContext.ipAddress, body.email)
    })
  )

  if (lockout.locked) {
    return Response.json(
      { error: 'Too many failed login attempts, please try again later' },
      {
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        headers: {
          'Retry-After': String(lockout.retryAfterSeconds),
        },
      }
    )
  }

  let result: AuthResult
  try {
    result = await runApp(
      Effect.gen(function* () {
        const auth = yield* AuthService
        return yield* auth.login(
          {
            email: body.email,
            password: body.password,
          },
          sessionContext
        )
      })
    )
    await runApp(
      Effect.gen(function* () {
        const authThrottle = yield* AuthThrottleService
        yield* authThrottle.clearLoginFailures(sessionContext.ipAddress, body.email)
      })
    )
  } catch (error) {
    if (error && typeof error === 'object' && '_tag' in error) {
      const tag = (error as { _tag: string })._tag
      if (tag === 'InvalidCredentialsError') {
        await runApp(
          Effect.gen(function* () {
            const authThrottle = yield* AuthThrottleService
            yield* authThrottle.recordLoginFailure(sessionContext.ipAddress, body.email)
          })
        )
      }
    }

    throw error
  }

  return Response.json({
    user: {
      id: result.user.id,
      email: result.user.email,
      username: result.user.username,
    },
    token: result.token,
  })
}

const sessionHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const token = extractBearerToken(req)
  if (!token) return errorResponse(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized')

  const sessionContext = getSessionContext(req)

  const result = await runApp(
    Effect.gen(function* () {
      const auth = yield* AuthService
      return yield* auth.validateSession(token, sessionContext)
    })
  )

  return Response.json({
    user: {
      id: result.user.id,
      email: result.user.email,
      username: result.user.username,
    },
    session: {
      id: result.session.id,
      expiresAt: result.session.expiresAt,
    },
  })
}

const refreshHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const token = extractBearerToken(req)
  if (!token) return errorResponse(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized')

  const sessionContext = getSessionContext(req)

  const result = await runApp(
    Effect.gen(function* () {
      const auth = yield* AuthService
      return yield* auth.refreshSession(token, sessionContext)
    })
  )

  return Response.json({ token: result.token })
}

const logoutHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const token = extractBearerToken(req)
  if (!token) return errorResponse(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized')

  const sessionContext = getSessionContext(req)

  await runApp(
    Effect.gen(function* () {
      const auth = yield* AuthService
      yield* auth.logout(token, sessionContext)
    })
  )

  return Response.json({ message: 'Logged out successfully' })
}

const basePath = BetterAuthConfig.basePath ?? '/api/auth'

export const authRoutes: readonly RouteDefinition[] = [
  { method: 'POST', path: `${basePath}/register`, handler: registerHandler },
  { method: 'POST', path: `${basePath}/login`, handler: loginHandler },
  { method: 'GET', path: `${basePath}/session`, handler: sessionHandler },
  { method: 'POST', path: `${basePath}/refresh`, handler: refreshHandler },
  { method: 'POST', path: `${basePath}/logout`, handler: logoutHandler },
]
