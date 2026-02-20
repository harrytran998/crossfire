import { Effect, Context, Layer } from 'effect'
import IORedis from 'ioredis'
import { RedisConfig } from '@crossfire/shared'
import { RedisError } from '../errors'

type CircuitState = 'closed' | 'open' | 'half-open'

class CircuitBreaker {
  private state: CircuitState = 'closed'
  private failureCount = 0
  private lastFailureTime = 0
  private readonly threshold: number
  private readonly resetTimeout: number

  constructor(threshold: number, resetTimeout: number) {
    this.threshold = threshold
    this.resetTimeout = resetTimeout
  }

  private shouldAttemptReset(): boolean {
    return this.state === 'open' && Date.now() - this.lastFailureTime >= this.resetTimeout
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (!this.shouldAttemptReset()) {
        throw new Error('Circuit breaker is open')
      }
      this.state = 'half-open'
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failureCount = 0
    this.state = 'closed'
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
    if (this.failureCount >= this.threshold) {
      this.state = 'open'
    }
  }
}

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
    readonly isHealthy: () => Effect.Effect<boolean>
  }
>() {}

export const RedisServiceLive = Layer.scoped(
  RedisService,
  Effect.gen(function* () {
    const config = yield* RedisConfig

    const client = new IORedis(config.url, {
      maxRetriesPerRequest: config.maxRetriesPerRequest,
      enableOfflineQueue: true,
      lazyConnect: true,
      connectTimeout: config.connectTimeout,
      commandTimeout: config.commandTimeout,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError: (err) => {
        const targetErrors = ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EPIPE']
        return targetErrors.some((e) => err.message.includes(e))
      },
    })

    const circuitBreaker = new CircuitBreaker(
      config.circuitBreakerThreshold,
      config.circuitBreakerResetTimeout
    )

    yield* Effect.tryPromise({
      try: async () => circuitBreaker.execute(() => client.ping()),
      catch: (error) => new RedisError({ message: 'Failed to connect to Redis', cause: error }),
    })

    const get = (key: string): Effect.Effect<string | null, RedisError> =>
      Effect.tryPromise({
        try: async () => circuitBreaker.execute(() => client.get(key)),
        catch: (error) => new RedisError({ message: `Failed to get key: ${key}`, cause: error }),
      })

    const set = (key: string, value: string, ttl?: number): Effect.Effect<void, RedisError> =>
      Effect.tryPromise({
        try: async () => {
          await circuitBreaker.execute(async () => {
            if (ttl != null && ttl > 0) {
              await client.setex(key, ttl, value)
            } else {
              await client.set(key, value)
            }
          })
        },
        catch: (error) => new RedisError({ message: `Failed to set key: ${key}`, cause: error }),
      })

    const del = (key: string): Effect.Effect<void, RedisError> =>
      Effect.tryPromise({
        try: async () => circuitBreaker.execute(() => client.del(key)),
        catch: (error) => new RedisError({ message: `Failed to delete key: ${key}`, cause: error }),
      })

    const hset = (key: string, field: string, value: string): Effect.Effect<void, RedisError> =>
      Effect.tryPromise({
        try: async () => circuitBreaker.execute(() => client.hset(key, field, value)),
        catch: (error) =>
          new RedisError({ message: `Failed to hset ${key}:${field}`, cause: error }),
      })

    const hget = (key: string, field: string): Effect.Effect<string | null, RedisError> =>
      Effect.tryPromise({
        try: async () => circuitBreaker.execute(() => client.hget(key, field)),
        catch: (error) =>
          new RedisError({ message: `Failed to hget ${key}:${field}`, cause: error }),
      })

    const hgetall = (key: string): Effect.Effect<Record<string, string>, RedisError> =>
      Effect.tryPromise({
        try: async () => circuitBreaker.execute(() => client.hgetall(key)),
        catch: (error) => new RedisError({ message: `Failed to hgetall ${key}`, cause: error }),
      })

    const expire = (key: string, seconds: number): Effect.Effect<void, RedisError> =>
      Effect.tryPromise({
        try: async () => circuitBreaker.execute(() => client.expire(key, seconds)),
        catch: (error) => new RedisError({ message: `Failed to expire ${key}`, cause: error }),
      })

    const isHealthy = (): Effect.Effect<boolean> =>
      Effect.tryPromise({
        try: async () => {
          const result = await client.ping()
          return result === 'PONG'
        },
        catch: () => false,
      }).pipe(Effect.orElse(() => Effect.succeed(false)))

    yield* Effect.addFinalizer(() => Effect.promise(async () => client.quit()).pipe(Effect.orDie))

    return RedisService.of({ client, get, set, del, hset, hget, hgetall, expire, isHealthy })
  })
)
