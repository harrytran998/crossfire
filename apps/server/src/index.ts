import { Effect, Layer } from 'effect'
import { serve } from 'bun'
import { ServerConfig } from '@crossfire/shared'
import { ConfigLayer } from './layers'
import { DatabaseServiceLive } from './services/database.service'
import { AuthServiceLive } from './modules/auth/application/services/auth.service'
import { PlayerServiceLive } from './modules/player/application/services/player.service'
import { StaticDataServiceLive } from './modules/static-data/application/services/static-data.service'
import { handleTaggedError } from './http/response'
import { handleAuthRequest } from './modules/auth'
import { handlePlayerRequest } from './modules/player'
import { handleStaticDataRequest } from './modules/static-data'

const BaseLayer = Layer.mergeAll(ConfigLayer, DatabaseServiceLive)

const AppLayer = Layer.mergeAll(
  Layer.provide(AuthServiceLive, BaseLayer),
  Layer.provide(PlayerServiceLive, BaseLayer),
  Layer.provide(StaticDataServiceLive, BaseLayer)
)

const runApp = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  Effect.runPromise(Effect.provide(effect, AppLayer) as Effect.Effect<A, E, never>)

const tryRouteHandlers = async (req: Request, path: string): Promise<Response | null> => {
  const handlers = [handleAuthRequest, handlePlayerRequest, handleStaticDataRequest] as const
  for (const handler of handlers) {
    const response = await handler(req, path, runApp)
    if (response) {
      return response
    }
  }

  return null
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
        const response = await tryRouteHandlers(req, path)
        return response ?? new Response('Not Found', { status: 404 })
      } catch (error) {
        return handleTaggedError(error)
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
