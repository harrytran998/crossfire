import { Effect } from 'effect'
import { AuthService } from '../../application/services/auth.service'
import { BetterAuthConfig } from '../../infrastructure/adapters/better-auth.config'
import type { AuthResult } from '../../domain/entities/user.entity'
import { errorResponse } from '../../../../http/response'
import { extractBearerToken, getClientIp, parseJsonObject } from '../../../../http/request'
import type { RouteDefinition } from '../../../../http/radix-router'
import {
  clearLoginFailures,
  consumeAuthRateLimit,
  getLoginLockout,
  recordLoginFailure,
} from './auth-security'

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const isValidUsername = (value: string) => /^[a-zA-Z0-9_]{3,32}$/.test(value)
const isStrongPassword = (value: string) =>
  value.length >= 8 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /\d/.test(value) &&
  /[^a-zA-Z0-9]/.test(value)

const getString = (value: unknown): string => (typeof value === 'string' ? value : '')

const registerHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const ip = getClientIp(req)
  const rateLimit = consumeAuthRateLimit('register', ip)
  if (!rateLimit.allowed) {
    return Response.json(
      { error: 'Too many requests, please try again later' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      }
    )
  }

  const parsed = await parseJsonObject(req)
  if (!parsed.ok) return parsed.response

  const email = getString(parsed.body.email)
  const username = getString(parsed.body.username)
  const password = getString(parsed.body.password)

  if (!isValidEmail(email)) return errorResponse(400, 'Invalid email format')
  if (!isValidUsername(username)) {
    return errorResponse(
      400,
      'Username must be 3-32 characters and use letters, numbers, underscore'
    )
  }
  if (!isStrongPassword(password)) {
    return errorResponse(
      400,
      'Password must be at least 8 chars and include uppercase, lowercase, number, special char'
    )
  }

  const result = await runApp(
    Effect.gen(function* () {
      const auth = yield* AuthService
      return yield* auth.register({ email, username, password })
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
    { status: 201 }
  )
}

const loginHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const ip = getClientIp(req)
  const rateLimit = consumeAuthRateLimit('login', ip)
  if (!rateLimit.allowed) {
    return Response.json(
      { error: 'Too many requests, please try again later' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      }
    )
  }

  const parsed = await parseJsonObject(req)
  if (!parsed.ok) return parsed.response

  const email = getString(parsed.body.email)
  const password = getString(parsed.body.password)

  if (!isValidEmail(email) || password.length === 0) {
    return errorResponse(400, 'Email and password are required')
  }

  const lockout = getLoginLockout(ip, email)
  if (lockout.locked) {
    return Response.json(
      { error: 'Too many failed login attempts, please try again later' },
      {
        status: 429,
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
        return yield* auth.login({ email, password })
      })
    )
    clearLoginFailures(ip, email)
  } catch (error) {
    if (error && typeof error === 'object' && '_tag' in error) {
      const tag = (error as { _tag: string })._tag
      if (tag === 'InvalidCredentialsError') {
        recordLoginFailure(ip, email)
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
  if (!token) return errorResponse(401, 'Unauthorized')

  const result = await runApp(
    Effect.gen(function* () {
      const auth = yield* AuthService
      return yield* auth.validateSession(token)
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
  if (!token) return errorResponse(401, 'Unauthorized')

  const result = await runApp(
    Effect.gen(function* () {
      const auth = yield* AuthService
      return yield* auth.refreshSession(token)
    })
  )

  return Response.json({ token: result.token })
}

const logoutHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const token = extractBearerToken(req)
  if (!token) return errorResponse(401, 'Unauthorized')

  await runApp(
    Effect.gen(function* () {
      const auth = yield* AuthService
      yield* auth.logout(token)
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
