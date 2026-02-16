import { Effect, Layer } from 'effect'
import { serve } from 'bun'
import { ServerConfig } from '@crossfire/shared'
import { ConfigLayer } from './layers'
import { DatabaseServiceLive } from './services/database.service'
import { AuthServiceLive } from './modules/auth/application/services/auth.service'
import { PlayerServiceLive } from './modules/player/application/services/player.service'
import { StaticDataServiceLive } from './modules/static-data/application/services/static-data.service'
import { handleTaggedError } from './http/response'
import { applySecurityHeaders, handlePreflightRequest } from './http/security'
import { RadixRouter, type RouteDefinition } from './http/radix-router'
import { HTTP_STATUS } from './http/status'
import { authRoutes } from './modules/auth'
import { playerRoutes } from './modules/player'
import { staticDataRoutes } from './modules/static-data'

const BaseLayer = Layer.mergeAll(ConfigLayer, DatabaseServiceLive)

const AppLayer = Layer.mergeAll(
  Layer.provide(AuthServiceLive, BaseLayer),
  Layer.provide(PlayerServiceLive, BaseLayer),
  Layer.provide(StaticDataServiceLive, BaseLayer)
)

const runApp = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  Effect.runPromise(Effect.provide(effect, AppLayer) as Effect.Effect<A, E, never>)

const router = new RadixRouter()

const baseRoutes: readonly RouteDefinition[] = [
  {
    method: 'GET',
    path: '/health',
    handler: async () => new Response('OK', { status: HTTP_STATUS.OK }),
  },
  {
    method: 'GET',
    path: '/api',
    handler: async () =>
      Response.json({
        name: 'Crossfire API',
        version: '0.1.0',
        status: 'running',
      }),
  },
]

router.addMany(baseRoutes)
router.addMany(authRoutes)
router.addMany(playerRoutes)
router.addMany(staticDataRoutes)

const dispatchRoute = async (req: Request, path: string): Promise<Response> => {
  const match = router.match(req.method, path)

  if (match.kind === 'not_found') {
    return new Response('Not Found', { status: HTTP_STATUS.NOT_FOUND })
  }

  if (match.kind === 'method_not_allowed') {
    return new Response('Method Not Allowed', {
      status: HTTP_STATUS.METHOD_NOT_ALLOWED,
      headers: {
        Allow: match.allow.join(', '),
      },
    })
  }

  return match.handler(req, {
    params: match.params,
    runApp,
  })
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
      const path = new URL(req.url).pathname

      const preflight = handlePreflightRequest(req)
      if (preflight) {
        return applySecurityHeaders(preflight, req)
      }

      try {
        const response = await dispatchRoute(req, path)
        return applySecurityHeaders(response, req)
      } catch (error) {
        return applySecurityHeaders(handleTaggedError(error), req)
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

void Effect.runPromise(Main as Effect.Effect<void, never, never>)
