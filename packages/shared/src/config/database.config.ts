import { Config, Effect, Redacted } from 'effect'

export class DatabaseConfig extends Effect.Service<DatabaseConfig>()('DatabaseConfig', {
  effect: Effect.gen(function* () {
    const url = yield* Config.redacted('DATABASE_URL')
    const host = yield* Config.string('DB_HOST').pipe(Config.withDefault('localhost'))
    const port = yield* Config.integer('DB_PORT').pipe(Config.withDefault(5432))
    const name = yield* Config.string('DB_NAME').pipe(Config.withDefault('crossfire'))
    const user = yield* Config.string('DB_USER').pipe(Config.withDefault('postgres'))
    const password = yield* Config.redacted('DB_PASSWORD').pipe(
      Config.withDefault(Redacted.make('postgres'))
    )
    const poolMax = yield* Config.integer('DB_POOL_MAX').pipe(Config.withDefault(10))

    return {
      url: Redacted.value(url),
      host,
      port,
      name,
      user,
      password: Redacted.value(password),
      poolMax,
    }
  }),
}) {}
