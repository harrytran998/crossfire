import { Effect } from 'effect'
import { AuthService } from '../../application/services/auth.service'
import { BetterAuthConfig } from '../../infrastructure/adapters/better-auth.config'
import { errorResponse } from '../../../../http/response'
import { extractBearerToken, parseJsonObject } from '../../../../http/request'

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const isValidUsername = (value: string) => /^[a-zA-Z0-9_]{3,32}$/.test(value)
const isStrongPassword = (value: string) =>
  value.length >= 8 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /\d/.test(value) &&
  /[^a-zA-Z0-9]/.test(value)

const getString = (value: unknown): string => (typeof value === 'string' ? value : '')

export const handleAuthRequest = async (
  req: Request,
  path: string,
  runApp: <A, E, R>(effect: Effect.Effect<A, E, R>) => Promise<A>
): Promise<Response | null> => {
  const basePath = BetterAuthConfig.basePath ?? '/api/auth'
  if (!path.startsWith(basePath)) {
    return null
  }

  if (path === `${basePath}/register` && req.method === 'POST') {
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

  if (path === `${basePath}/login` && req.method === 'POST') {
    const parsed = await parseJsonObject(req)
    if (!parsed.ok) return parsed.response

    const email = getString(parsed.body.email)
    const password = getString(parsed.body.password)

    if (!isValidEmail(email) || password.length === 0) {
      return errorResponse(400, 'Email and password are required')
    }

    const result = await runApp(
      Effect.gen(function* () {
        const auth = yield* AuthService
        return yield* auth.login({ email, password })
      })
    )

    return Response.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
      },
      token: result.token,
    })
  }

  if (path === `${basePath}/session` && req.method === 'GET') {
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

  if (path === `${basePath}/refresh` && req.method === 'POST') {
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

  if (path === `${basePath}/logout` && req.method === 'POST') {
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

  return null
}
