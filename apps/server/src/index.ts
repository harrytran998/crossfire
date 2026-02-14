import { Effect, Layer } from 'effect'
import { serve } from 'bun'
import {
  ServerConfig,
  DatabaseConfig,
  RedisConfig,
  AuthConfig,
  LoggingConfig,
} from '@crossfire/shared'

const ConfigLayer = Layer.mergeAll(
  ServerConfig.Live,
  DatabaseConfig.Live,
  RedisConfig.Live,
  AuthConfig.Live,
  LoggingConfig.Live
)

const Program = Effect.gen(function* (_) {
  const config = yield* ServerConfig

  yield* Effect.logInfo(`Server starting on ${config.host}:${config.port}`)
  yield* Effect.logInfo(`Environment: ${config.nodeEnv}`)
  yield* Effect.logInfo(`Game tick rate: ${config.gameTickRate}Hz`)

  const server = serve({
    hostname: config.host,
    port: config.port,
    fetch(req) {
      const url = new URL(req.url)

      if (url.pathname === '/health') {
        return new Response('OK', { status: 200 })
      }

      if (url.pathname === '/api') {
        return Response.json({
          name: 'Crossfire API',
          version: '0.1.0',
          status: 'running',
        })
      }

      return new Response('Not Found', { status: 404 })
    },
  })

  yield* Effect.logInfo(`Server is running at http://${server.hostname}:${server.port}`)

  yield* Effect.never
})

const Main = Program.pipe(
  Effect.provide(ConfigLayer),
  Effect.catchAllCause((error) => Effect.logFatal('Server crashed', error))
)

Effect.runPromise(Main)
