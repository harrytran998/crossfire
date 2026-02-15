import { Effect, Layer } from 'effect'
import { serve } from 'bun'
import { ServerConfig } from '@crossfire/shared'
import { ConfigLayer } from './layers'
import { DatabaseServiceLive } from './services/database.service'
import { AuthService, AuthServiceLive } from './modules/auth/application/services/auth.service'
import {
  PlayerService,
  PlayerServiceLive,
} from './modules/player/application/services/player.service'
import {
  StaticDataService,
  StaticDataServiceLive,
} from './modules/static-data/application/services/static-data.service'

const BaseLayer = Layer.mergeAll(ConfigLayer, DatabaseServiceLive)

const AppLayer = Layer.mergeAll(
  Layer.provide(AuthServiceLive, BaseLayer),
  Layer.provide(PlayerServiceLive, BaseLayer),
  Layer.provide(StaticDataServiceLive, BaseLayer)
)

const runApp = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  Effect.runPromise(Effect.provide(effect, AppLayer) as Effect.Effect<A, E, never>)

const extractBearerToken = (req: Request): string | null => {
  const header = req.headers.get('authorization')
  if (!header || !header.startsWith('Bearer ')) {
    return null
  }
  return header.slice(7)
}

const parseJsonBody = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    return (await request.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

const getString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback

const errorResponse = (status: number, message: string) =>
  Response.json({ error: message }, { status })

const handleError = (error: unknown): Response => {
  if (error && typeof error === 'object' && '_tag' in error) {
    const tag = (error as { _tag: string })._tag
    if (tag === 'InvalidCredentialsError') return errorResponse(401, 'Invalid email or password')
    if (tag === 'UnauthorizedError') return errorResponse(401, 'Unauthorized')
    if (tag === 'UserAlreadyExistsError') return errorResponse(409, 'User already exists')
    if (tag === 'PlayerAlreadyExistsError')
      return errorResponse(409, 'Player profile already exists')
    if (tag === 'PlayerNotFoundError') return errorResponse(404, 'Player not found')
    if (tag === 'UserBannedError') return errorResponse(403, 'Account banned')
  }
  return errorResponse(500, 'Internal server error')
}

const Program = Effect.gen(function* () {
  const config = yield* ServerConfig

  yield* Effect.logInfo(`Server starting on ${config.host}:${config.port}`)
  yield* Effect.logInfo(`Environment: ${config.nodeEnv}`)
  yield* Effect.logInfo(`Game tick rate: ${config.gameTickRate}Hz`)

  const server = serve({
    hostname: config.host,
    port: config.port,
    async fetch(req) {
      const url = new URL(req.url)
      const path = url.pathname

      if (path === '/health') {
        return new Response('OK', { status: 200 })
      }

      if (path === '/api') {
        return Response.json({
          name: 'Crossfire API',
          version: '0.1.0',
          status: 'running',
        })
      }

      try {
        if (path === '/api/auth/register' && req.method === 'POST') {
          const body = await parseJsonBody(req)
          const result = await runApp(
            Effect.gen(function* () {
              const auth = yield* AuthService
              return yield* auth.register({
                email: getString(body.email),
                username: getString(body.username),
                password: getString(body.password),
              })
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

        if (path === '/api/auth/login' && req.method === 'POST') {
          const body = await parseJsonBody(req)
          const result = await runApp(
            Effect.gen(function* () {
              const auth = yield* AuthService
              return yield* auth.login({
                email: getString(body.email),
                password: getString(body.password),
              })
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

        if (path === '/api/auth/session' && req.method === 'GET') {
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

        if (path === '/api/auth/refresh' && req.method === 'POST') {
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

        if (path === '/api/auth/logout' && req.method === 'POST') {
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

        const playerPath = '/api/players/me'
        if (path.startsWith(playerPath)) {
          const token = extractBearerToken(req)
          if (!token) return errorResponse(401, 'Unauthorized')

          const authSession = await runApp(
            Effect.gen(function* () {
              const auth = yield* AuthService
              return yield* auth.validateSession(token)
            })
          )

          if (path === '/api/players/me' && req.method === 'POST') {
            const body = await parseJsonBody(req)
            const player = await runApp(
              Effect.gen(function* () {
                const playerService = yield* PlayerService
                return yield* playerService.createProfile({
                  userId: authSession.user.id,
                  displayName: getString(body.displayName, authSession.user.username),
                  region: typeof body.region === 'string' ? body.region : undefined,
                  language: typeof body.language === 'string' ? body.language : undefined,
                })
              })
            )

            return Response.json({ player }, { status: 201 })
          }

          if (path === '/api/players/me' && req.method === 'GET') {
            const player = await runApp(
              Effect.gen(function* () {
                const playerService = yield* PlayerService
                return yield* playerService.getProfileByUserId(authSession.user.id)
              })
            )

            return Response.json({ player })
          }

          if (path === '/api/players/me' && req.method === 'PATCH') {
            const body = await parseJsonBody(req)
            const player = await runApp(
              Effect.gen(function* () {
                const playerService = yield* PlayerService
                return yield* playerService.updateProfile(authSession.user.id, {
                  displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
                  avatarUrl: typeof body.avatarUrl === 'string' ? body.avatarUrl : undefined,
                  bio: typeof body.bio === 'string' ? body.bio : undefined,
                  region: typeof body.region === 'string' ? body.region : undefined,
                  language: typeof body.language === 'string' ? body.language : undefined,
                })
              })
            )

            return Response.json({ player })
          }

          if (path === '/api/players/me/stats' && req.method === 'GET') {
            const stats = await runApp(
              Effect.gen(function* () {
                const playerService = yield* PlayerService
                return yield* playerService.getStatsByUserId(authSession.user.id)
              })
            )

            return Response.json({ stats })
          }

          if (path === '/api/players/me/progression' && req.method === 'GET') {
            const progression = await runApp(
              Effect.gen(function* () {
                const playerService = yield* PlayerService
                return yield* playerService.getProgressionByUserId(authSession.user.id)
              })
            )

            return Response.json({ progression })
          }
        }

        if (path === '/api/static/weapons' && req.method === 'GET') {
          const weapons = await runApp(
            Effect.gen(function* () {
              const staticData = yield* StaticDataService
              return yield* staticData.getWeapons()
            })
          )
          return Response.json({ weapons })
        }

        if (
          path.startsWith('/api/static/weapons/') &&
          path.endsWith('/attachments') &&
          req.method === 'GET'
        ) {
          const weaponKey = path.replace('/api/static/weapons/', '').replace('/attachments', '')
          const attachments = await runApp(
            Effect.gen(function* () {
              const staticData = yield* StaticDataService
              return yield* staticData.getWeaponAttachmentsByKey(weaponKey)
            })
          )
          return Response.json({ attachments })
        }

        if (path === '/api/static/maps' && req.method === 'GET') {
          const maps = await runApp(
            Effect.gen(function* () {
              const staticData = yield* StaticDataService
              return yield* staticData.getMaps()
            })
          )
          return Response.json({ maps })
        }

        return new Response('Not Found', { status: 404 })
      } catch (error) {
        return handleError(error)
      }
    },
  })

  yield* Effect.logInfo(`Server is running at http://${server.hostname}:${server.port}`)

  yield* Effect.never
})

const Main = Program.pipe(
  Effect.provide(ConfigLayer),
  Effect.catchAllCause((error) => Effect.logFatal('Server crashed', error))
)

void Effect.runPromise(Main)
