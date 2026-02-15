import { Effect, Context, Layer } from 'effect'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { DatabaseConfig } from '@crossfire/shared'
import { DatabaseError } from '../errors'
import type { Database } from '@crossfire/database'

export class DatabaseService extends Context.Tag('DatabaseService')<
  DatabaseService,
  {
    readonly db: Kysely<Database>
    readonly query: <T>(fn: (db: Kysely<Database>) => Promise<T>) => Effect.Effect<T, DatabaseError>
  }
>() {}

export const DatabaseServiceLive = Layer.scoped(
  DatabaseService,
  Effect.gen(function* () {
    const config = yield* DatabaseConfig

    const db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new Pool({
          connectionString: config.url,
          max: config.poolMax,
        }),
      }),
    })

    const query = <T>(fn: (db: Kysely<Database>) => Promise<T>): Effect.Effect<T, DatabaseError> =>
      Effect.tryPromise({
        try: async () => fn(db),
        catch: (error) => new DatabaseError({ message: 'Query failed', cause: error }),
      })

    yield* Effect.addFinalizer(() => Effect.promise(async () => db.destroy()).pipe(Effect.orDie))

    return DatabaseService.of({ db, query })
  })
).pipe(Layer.provide(DatabaseConfig.Default))
