import { Effect, Context, Layer } from 'effect'
import IORedis from 'ioredis'
import { RedisConfig } from '@crossfire/shared'
import { RedisError } from '../errors'

export class RedisService extends Context.Tag('RedisService')<
  RedisService,
  {
    readonly client: IORedis
    readonly get: (key: string) => Effect.Effect<string | null, RedisError>
    readonly set: (key: string, value: string, ttl?: number) => Effect.Effect<void, RedisError>
    readonly del: (key: string) => Effect.Effect<void, RedisError>
    readonly hset: (key: string, field: string, value: string) => Effect.Effect<void, RedisError>
    readonly hget: (key: string, field: string) => Effect.Effect<string | null, RedisError>
    readonly hgetall: (key: string) => Effect.Effect<Record<string, string>, RedisError>
    readonly expire: (key: string, seconds: number) => Effect.Effect<void, RedisError>
  }
>() {}

export const RedisServiceLive = Effect.gen(function* (_) {
  const config = yield* RedisConfig

  const client = new IORedis(config.url, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
  })

  yield* Effect.tryPromise({
    try: () => client.ping(),
    catch: (error) => new RedisError({ message: 'Failed to connect to Redis', cause: error }),
  })

  const get = (key: string): Effect.Effect<string | null, RedisError> =>
    Effect.tryPromise({
      try: () => client.get(key),
      catch: (error) => new RedisError({ message: `Failed to get key: ${key}`, cause: error }),
    })

  const set = (key: string, value: string, ttl?: number): Effect.Effect<void, RedisError> =>
    Effect.tryPromise({
      try: async () => {
        if (ttl) {
          await client.setex(key, ttl, value)
        } else {
          await client.set(key, value)
        }
      },
      catch: (error) => new RedisError({ message: `Failed to set key: ${key}`, cause: error }),
    })

  const del = (key: string): Effect.Effect<void, RedisError> =>
    Effect.tryPromise({
      try: async () => {
        await client.del(key)
      },
      catch: (error) => new RedisError({ message: `Failed to delete key: ${key}`, cause: error }),
    })

  const hset = (key: string, field: string, value: string): Effect.Effect<void, RedisError> =>
    Effect.tryPromise({
      try: async () => {
        await client.hset(key, field, value)
      },
      catch: (error) => new RedisError({ message: `Failed to hset ${key}:${field}`, cause: error }),
    })

  const hget = (key: string, field: string): Effect.Effect<string | null, RedisError> =>
    Effect.tryPromise({
      try: () => client.hget(key, field),
      catch: (error) => new RedisError({ message: `Failed to hget ${key}:${field}`, cause: error }),
    })

  const hgetall = (key: string): Effect.Effect<Record<string, string>, RedisError> =>
    Effect.tryPromise({
      try: () => client.hgetall(key),
      catch: (error) => new RedisError({ message: `Failed to hgetall ${key}`, cause: error }),
    })

  const expire = (key: string, seconds: number): Effect.Effect<void, RedisError> =>
    Effect.tryPromise({
      try: async () => {
        await client.expire(key, seconds)
      },
      catch: (error) => new RedisError({ message: `Failed to expire ${key}`, cause: error }),
    })

  yield* Effect.addFinalizer(() => Effect.promise(() => client.quit()).pipe(Effect.orDie))

  return RedisService.of({ client, get, set, del, hset, hget, hgetall, expire })
}).pipe(Effect.provide(RedisConfig.Live), Layer.scoped(RedisService))
