import { Context, Effect, Layer } from 'effect'
import { RedisService, RedisServiceLive } from '../../../../services/redis.service'

const LOGIN_WINDOW_MS = 60_000
const LOGIN_MAX_REQUESTS = 5
const REGISTER_WINDOW_MS = 60_000
const REGISTER_MAX_REQUESTS = 8

const LOCKOUT_WINDOW_MS = 15 * 60_000
const LOCKOUT_AFTER_FAILURES = 5
const LOCKOUT_DURATION_MS = 10 * 60_000

type AuthRoute = 'login' | 'register'
type ApiRoute = 'inventory-acquire' | 'friends-request' | 'leaderboards-read'

const API_ROUTE_LIMITS: Record<
  ApiRoute,
  {
    readonly maxRequests: number
    readonly windowMs: number
  }
> = {
  'inventory-acquire': {
    maxRequests: 20,
    windowMs: 60_000,
  },
  'friends-request': {
    maxRequests: 10,
    windowMs: 60_000,
  },
  'leaderboards-read': {
    maxRequests: 60,
    windowMs: 60_000,
  },
}

const rateLimitKey = (route: AuthRoute, ip: string | null) => `auth:ratelimit:${route}:${ip ?? 'unknown'}`
const apiRateLimitKey = (route: ApiRoute, subject: string) => `api:ratelimit:${route}:${subject}`
const lockoutKey = (ip: string | null, email: string) => `auth:lockout:${ip ?? 'unknown'}:${email.toLowerCase()}`
const loginFailureKey = (ip: string | null, email: string) =>
  `auth:login-fail:${ip ?? 'unknown'}:${email.toLowerCase()}`

const ttlSeconds = (milliseconds: number): number => Math.max(1, Math.ceil(milliseconds / 1000))

export interface AuthRateLimitResult {
  readonly allowed: true
}

export interface AuthRateLimitBlockedResult {
  readonly allowed: false
  readonly retryAfterSeconds: number
}

export interface LoginLockoutResult {
  readonly locked: false
}

export interface LoginLockoutBlockedResult {
  readonly locked: true
  readonly retryAfterSeconds: number
}

export class AuthThrottleService extends Context.Tag('AuthThrottleService')<
  AuthThrottleService,
  {
    readonly consumeAuthRateLimit: (
      route: AuthRoute,
      ip: string | null
    ) => Effect.Effect<AuthRateLimitResult | AuthRateLimitBlockedResult>
    readonly getLoginLockout: (
      ip: string | null,
      email: string
    ) => Effect.Effect<LoginLockoutResult | LoginLockoutBlockedResult>
    readonly recordLoginFailure: (ip: string | null, email: string) => Effect.Effect<void>
    readonly clearLoginFailures: (ip: string | null, email: string) => Effect.Effect<void>
    readonly consumeApiRateLimit: (
      route: ApiRoute,
      subject: string
    ) => Effect.Effect<AuthRateLimitResult | AuthRateLimitBlockedResult>
  }
>() {}

export const AuthThrottleServiceLive = Layer.effect(
  AuthThrottleService,
  Effect.gen(function* () {
    const redis = yield* RedisService

    const consumeAuthRateLimit = (
      route: AuthRoute,
      ip: string | null
    ): Effect.Effect<AuthRateLimitResult | AuthRateLimitBlockedResult> =>
      Effect.tryPromise({
        try: async () => {
          const key = rateLimitKey(route, ip)
          const maxRequests = route === 'login' ? LOGIN_MAX_REQUESTS : REGISTER_MAX_REQUESTS
          const windowMs = route === 'login' ? LOGIN_WINDOW_MS : REGISTER_WINDOW_MS
          const windowSeconds = ttlSeconds(windowMs)

          const count = await redis.client.incr(key)
          if (count === 1) {
            await redis.client.expire(key, windowSeconds)
          }

          if (count <= maxRequests) {
            return { allowed: true as const }
          }

          const ttl = await redis.client.ttl(key)
          return {
            allowed: false as const,
            retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
          }
        },
        catch: (error) =>
          error instanceof Error ? error : new Error('Failed to evaluate auth rate limit'),
      }).pipe(Effect.orDie)

    const getLoginLockout = (
      ip: string | null,
      email: string
    ): Effect.Effect<LoginLockoutResult | LoginLockoutBlockedResult> =>
      Effect.tryPromise({
        try: async () => {
          const key = lockoutKey(ip, email)
          const ttl = await redis.client.ttl(key)
          if (ttl > 0) {
            return {
              locked: true as const,
              retryAfterSeconds: ttl,
            }
          }

          return { locked: false as const }
        },
        catch: (error) =>
          error instanceof Error ? error : new Error('Failed to fetch login lockout state'),
      }).pipe(Effect.orDie)

    const recordLoginFailure = (ip: string | null, email: string): Effect.Effect<void> =>
      Effect.tryPromise({
        try: async () => {
          const failKey = loginFailureKey(ip, email)
          const failWindowSeconds = ttlSeconds(LOCKOUT_WINDOW_MS)
          const lockSeconds = ttlSeconds(LOCKOUT_DURATION_MS)

          const failedCount = await redis.client.incr(failKey)
          if (failedCount === 1) {
            await redis.client.expire(failKey, failWindowSeconds)
          }

          if (failedCount >= LOCKOUT_AFTER_FAILURES) {
            await redis.client.set(lockoutKey(ip, email), '1', 'EX', lockSeconds)
            await redis.client.del(failKey)
          }
        },
        catch: (error) =>
          error instanceof Error ? error : new Error('Failed to record login failure'),
      }).pipe(Effect.orDie)

    const clearLoginFailures = (ip: string | null, email: string): Effect.Effect<void> =>
      Effect.tryPromise({
        try: async () => {
          await redis.client.del(loginFailureKey(ip, email))
          await redis.client.del(lockoutKey(ip, email))
        },
        catch: (error) =>
          error instanceof Error ? error : new Error('Failed to clear login failures'),
      }).pipe(Effect.orDie)

    const consumeApiRateLimit = (
      route: ApiRoute,
      subject: string
    ): Effect.Effect<AuthRateLimitResult | AuthRateLimitBlockedResult> =>
      Effect.tryPromise({
        try: async () => {
          const key = apiRateLimitKey(route, subject)
          const config = API_ROUTE_LIMITS[route]
          const windowSeconds = ttlSeconds(config.windowMs)

          const count = await redis.client.incr(key)
          if (count === 1) {
            await redis.client.expire(key, windowSeconds)
          }

          if (count <= config.maxRequests) {
            return { allowed: true as const }
          }

          const ttl = await redis.client.ttl(key)
          return {
            allowed: false as const,
            retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
          }
        },
        catch: (error) =>
          error instanceof Error ? error : new Error('Failed to evaluate api rate limit'),
      }).pipe(Effect.orDie)

    return AuthThrottleService.of({
      consumeAuthRateLimit,
      getLoginLockout,
      recordLoginFailure,
      clearLoginFailures,
      consumeApiRateLimit,
    })
  })
).pipe(Layer.provide(RedisServiceLive))
