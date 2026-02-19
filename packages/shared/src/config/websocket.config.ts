import { Config, Effect } from 'effect'

export class WebSocketConfig extends Effect.Service<WebSocketConfig>()('WebSocketConfig', {
  effect: Effect.gen(function* () {
    const path = yield* Config.string('WS_PATH').pipe(Config.withDefault('/ws'))
    const pingIntervalMs = yield* Config.integer('WS_PING_INTERVAL_MS').pipe(
      Config.withDefault(30_000)
    )
    const pongTimeoutMs = yield* Config.integer('WS_PONG_TIMEOUT_MS').pipe(Config.withDefault(10_000))
    const tickIntervalMs = yield* Config.integer('WS_HEARTBEAT_TICK_MS').pipe(
      Config.withDefault(1_000)
    )

    return {
      path,
      pingIntervalMs,
      pongTimeoutMs,
      tickIntervalMs,
    }
  }),
}) {}
