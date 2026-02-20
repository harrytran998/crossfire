import { Config, Effect, Redacted } from 'effect'

export class RedisConfig extends Effect.Service<RedisConfig>()('RedisConfig', {
  effect: Effect.gen(function* () {
    const url = yield* Config.redacted('REDIS_URL')
    const host = yield* Config.string('REDIS_HOST').pipe(Config.withDefault('localhost'))
    const port = yield* Config.integer('REDIS_PORT').pipe(Config.withDefault(6379))
    const maxRetriesPerRequest = yield* Config.integer('REDIS_MAX_RETRIES').pipe(Config.withDefault(3))
    const connectTimeout = yield* Config.integer('REDIS_CONNECT_TIMEOUT').pipe(Config.withDefault(10000))
    const commandTimeout = yield* Config.integer('REDIS_COMMAND_TIMEOUT').pipe(Config.withDefault(5000))
    const circuitBreakerThreshold = yield* Config.integer('REDIS_CIRCUIT_BREAKER_THRESHOLD').pipe(Config.withDefault(5))
    const circuitBreakerResetTimeout = yield* Config.integer('REDIS_CIRCUIT_BREAKER_RESET').pipe(Config.withDefault(30000))

    return {
      url: Redacted.value(url),
      host,
      port,
      maxRetriesPerRequest,
      connectTimeout,
      commandTimeout,
      circuitBreakerThreshold,
      circuitBreakerResetTimeout,
    }
  }),
}) {}
