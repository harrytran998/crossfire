import { Config, Effect, Redacted } from 'effect'

const hasWeakDatabaseCredential = (value: string): boolean => {
  const normalized = value.trim().toLowerCase()
  return (
    normalized === 'postgres' ||
    normalized === 'password' ||
    normalized === 'changeme' ||
    normalized.includes('replace_with')
  )
}

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
    const nodeEnv = yield* Config.string('NODE_ENV').pipe(Config.withDefault('development'))

    const decodedUrl = Redacted.value(url)
    const decodedPassword = Redacted.value(password)

    if (nodeEnv === 'production') {
      if (hasWeakDatabaseCredential(decodedPassword)) {
        return yield* Effect.fail(new Error('DB_PASSWORD is weak or placeholder in production'))
      }

      if (decodedUrl.includes('postgres:postgres@')) {
        return yield* Effect.fail(new Error('DATABASE_URL uses default postgres credentials'))
      }
    }

    return {
      url: decodedUrl,
      host,
      port,
      name,
      user,
      password: decodedPassword,
      poolMax,
    }
  }),
}) {}
