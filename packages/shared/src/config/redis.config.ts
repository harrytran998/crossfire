import { Config, Effect, Redacted } from 'effect'

export class RedisConfig extends Effect.Service<RedisConfig>()('RedisConfig', {
  succeed: Effect.gen(function* () {
    const url = yield* Config.redacted('REDIS_URL')
    const host = yield* Config.string('REDIS_HOST').pipe(Config.withDefault('localhost'))
    const port = yield* Config.integer('REDIS_PORT').pipe(Config.withDefault(6379))

    return {
      url: Redacted.value(url),
      host,
      port,
    }
  }),
}) {}
