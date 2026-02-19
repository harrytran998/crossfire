import { Effect, Layer } from 'effect'
import { serve } from 'bun'
import { ServerConfig } from '@crossfire/shared'
import { ConfigLayer } from './layers'
import { DatabaseServiceLive } from './services/database.service'
import { AuthServiceLive } from './modules/auth/application/services/auth.service'
import { PlayerServiceLive } from './modules/player/application/services/player.service'
import { StaticDataServiceLive } from './modules/static-data/application/services/static-data.service'
import { InventoryServiceLive } from './modules/inventory/application/services/inventory.service'
import { LoadoutServiceLive } from './modules/loadout/application/services/loadout.service'
import { MatchServiceLive } from './modules/match/application/services/match.service'
import { LeaderboardServiceLive } from './modules/leaderboard/application/services/leaderboard.service'
import { FriendsServiceLive } from './modules/friends/application/services/friends.service'
import {
  OutboxDispatcherService,
  OutboxDispatcherServiceLive,
} from './services/outbox-dispatcher.service'
import { OutboxServiceLive } from './services/outbox.service'
import { handleTaggedError } from './http/response'
import {
  applySecurityHeaders,
  enforceRequestSecurity,
  handlePreflightRequest,
} from './http/security'
import { RadixRouter, type RouteDefinition } from './http/radix-router'
import { HTTP_STATUS } from './http/status'
import { authRoutes } from './modules/auth'
import { AuthThrottleServiceLive } from './modules/auth'
import { playerRoutes } from './modules/player'
import { staticDataRoutes } from './modules/static-data'
import { inventoryRoutes } from './modules/inventory'
import { loadoutRoutes } from './modules/loadout'
import { matchRoutes } from './modules/match'
import { leaderboardRoutes } from './modules/leaderboard'
import { friendsRoutes } from './modules/friends'

const BaseLayer = Layer.mergeAll(ConfigLayer, DatabaseServiceLive)

const AppLayer = Layer.mergeAll(
  Layer.provide(AuthServiceLive, BaseLayer),
  Layer.provide(AuthThrottleServiceLive, ConfigLayer),
  Layer.provide(PlayerServiceLive, BaseLayer),
  Layer.provide(StaticDataServiceLive, BaseLayer),
  Layer.provide(InventoryServiceLive, BaseLayer),
  Layer.provide(LoadoutServiceLive, BaseLayer),
  Layer.provide(MatchServiceLive, BaseLayer),
  Layer.provide(LeaderboardServiceLive, BaseLayer),
  Layer.provide(FriendsServiceLive, BaseLayer),
  Layer.provide(OutboxServiceLive, BaseLayer),
  Layer.provide(OutboxDispatcherServiceLive, Layer.provide(OutboxServiceLive, BaseLayer))
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
router.addMany(inventoryRoutes)
router.addMany(loadoutRoutes)
router.addMany(matchRoutes)
router.addMany(leaderboardRoutes)
router.addMany(friendsRoutes)

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

  setInterval(() => {
    void runApp(
      Effect.gen(function* () {
        const dispatcher = yield* OutboxDispatcherService
        return yield* dispatcher.processPending(25)
      })
    )
      .then((result) => {
        if (result.failed > 0 || result.deadLettered > 0) {
          void runApp(
            Effect.logWarning(
              `Outbox dispatcher processed=${result.processed} failed=${result.failed} dead_lettered=${result.deadLettered}`
            )
          )
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          void runApp(Effect.logError(`Outbox dispatcher failure: ${error.message}`))
          return
        }
        void runApp(Effect.logError('Outbox dispatcher failure'))
      })
  }, 3000)

  const server = serve({
    hostname: config.host,
    port: config.port,
    async fetch(req) {
      const path = new URL(req.url).pathname

      const preflight = handlePreflightRequest(req)
      if (preflight) {
        return applySecurityHeaders(preflight, req)
      }

      const securityRejection = enforceRequestSecurity(req)
      if (securityRejection) {
        return applySecurityHeaders(securityRejection, req)
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
  Effect.provide(AppLayer),
  Effect.catchAllCause((error) => Effect.logFatal('Server crashed', error))
)

void Effect.runPromise(Main as Effect.Effect<void, never, never>)
