import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './types'

export const createDbClient = (connectionString: string): Kysely<Database> => {
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString,
        max: 10,
      }),
    }),
  })
}
