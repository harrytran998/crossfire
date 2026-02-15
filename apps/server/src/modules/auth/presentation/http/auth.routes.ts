import { Effect, Context } from 'effect'
import { HttpRouter, HttpServerResponse, HttpServerRequest } from '@effect/platform'
import { AuthService as AuthServiceTag } from '../../application/services/auth.service'
import { RegistrationSchema, LoginSchema, UnauthorizedError } from '../../domain/errors/auth.errors'
import type { User, Session } from '../../domain/entities/user.entity'

export interface CurrentAuth {
  readonly user: User
  readonly session: Session
}

export const CurrentAuth = Context.GenericTag<CurrentAuth>('CurrentAuth')

const extractBearerToken = (request: HttpServerRequest.HttpServerRequest): string | null => {
  const authHeader = request.headers['authorization']
  if (!authHeader || typeof authHeader !== 'string') return null
  if (!authHeader.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}

export const AuthMiddleware = Effect.gen(function* () {
  const authService = yield* AuthServiceTag

  return <A, E>(effect: Effect.Effect<A, E, CurrentAuth>) =>
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const token = extractBearerToken(request)

      if (!token) {
        return yield* Effect.fail(new UnauthorizedError())
      }

      const { user, session } = yield* authService.validateSession(token)

      return yield* Effect.provideService(effect, CurrentAuth, { user, session })
    })
})

const registerHandler = Effect.gen(function* () {
  const authService = yield* AuthServiceTag
  const body = yield* HttpServerRequest.schemaBodyJson(RegistrationSchema)
  const result = yield* authService.register({
    username: body.username,
    email: body.email,
    password: body.password,
  })

  yield* Effect.logInfo(`User registered: ${result.user.id}`)

  return yield* HttpServerResponse.json(
    {
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
      },
      token: result.token,
    },
    { status: 201 }
  )
})

const loginHandler = Effect.gen(function* () {
  const authService = yield* AuthServiceTag
  const body = yield* HttpServerRequest.schemaBodyJson(LoginSchema)
  const result = yield* authService.login({
    email: body.email,
    password: body.password,
  })

  return yield* HttpServerResponse.json({
    user: {
      id: result.user.id,
      username: result.user.username,
      email: result.user.email,
    },
    token: result.token,
  })
})

const logoutHandler = Effect.gen(function* () {
  const authService = yield* AuthServiceTag
  const request = yield* HttpServerRequest.HttpServerRequest

  const token = extractBearerToken(request)
  if (token) {
    yield* authService.logout(token)
  }

  return yield* HttpServerResponse.json({ message: 'Logged out successfully' })
})

const sessionHandler = Effect.gen(function* () {
  const { user } = yield* CurrentAuth

  return yield* HttpServerResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
    },
  })
})

const refreshHandler = Effect.gen(function* () {
  const authService = yield* AuthServiceTag
  const request = yield* HttpServerRequest.HttpServerRequest

  const token = extractBearerToken(request)
  if (!token) {
    return yield* Effect.fail(new UnauthorizedError())
  }

  const result = yield* authService.refreshSession(token)

  return yield* HttpServerResponse.json({
    token: result.token,
    user: {
      id: result.user.id,
      username: result.user.username,
      email: result.user.email,
    },
  })
})

export const AuthRoutes = HttpRouter.empty.pipe(
  HttpRouter.post('/api/auth/register', registerHandler),
  HttpRouter.post('/api/auth/login', loginHandler),
  HttpRouter.post('/api/auth/logout', logoutHandler),
  HttpRouter.get('/api/auth/session', sessionHandler),
  HttpRouter.post('/api/auth/refresh', refreshHandler)
)
