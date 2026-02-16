type RateLimitBucket = {
  count: number
  resetAt: number
}

type LoginFailureState = {
  failedCount: number
  windowStartedAt: number
  lockedUntil: number
}

const rateLimitBuckets = new Map<string, RateLimitBucket>()
const loginFailureState = new Map<string, LoginFailureState>()

const LOGIN_WINDOW_MS = 60_000
const LOGIN_MAX_REQUESTS = 5
const REGISTER_WINDOW_MS = 60_000
const REGISTER_MAX_REQUESTS = 8

const LOCKOUT_WINDOW_MS = 15 * 60_000
const LOCKOUT_AFTER_FAILURES = 5
const LOCKOUT_DURATION_MS = 10 * 60_000

const now = () => Date.now()

const cleanupRateLimitBuckets = (currentTime: number): void => {
  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= currentTime) {
      rateLimitBuckets.delete(key)
    }
  }
}

const cleanupLoginFailures = (currentTime: number): void => {
  for (const [key, state] of loginFailureState) {
    const lockExpired = state.lockedUntil > 0 && state.lockedUntil <= currentTime
    const windowExpired = currentTime - state.windowStartedAt > LOCKOUT_WINDOW_MS
    if (lockExpired || windowExpired) {
      loginFailureState.delete(key)
    }
  }
}

const consumeRateLimit = (
  key: string,
  windowMs: number,
  maxRequests: number
): { allowed: true } | { allowed: false; retryAfterSeconds: number } => {
  const currentTime = now()
  cleanupRateLimitBuckets(currentTime)

  const existing = rateLimitBuckets.get(key)
  if (!existing || existing.resetAt <= currentTime) {
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt: currentTime + windowMs,
    })
    return { allowed: true }
  }

  existing.count += 1
  if (existing.count <= maxRequests) {
    return { allowed: true }
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - currentTime) / 1000)),
  }
}

export const consumeAuthRateLimit = (
  route: 'login' | 'register',
  ip: string
): { allowed: true } | { allowed: false; retryAfterSeconds: number } => {
  const key = `${route}:${ip}`
  if (route === 'login') {
    return consumeRateLimit(key, LOGIN_WINDOW_MS, LOGIN_MAX_REQUESTS)
  }

  return consumeRateLimit(key, REGISTER_WINDOW_MS, REGISTER_MAX_REQUESTS)
}

export const getLoginLockout = (
  ip: string,
  email: string
): { locked: false } | { locked: true; retryAfterSeconds: number } => {
  const currentTime = now()
  cleanupLoginFailures(currentTime)

  const key = `${ip}:${email.toLowerCase()}`
  const state = loginFailureState.get(key)
  if (!state || state.lockedUntil <= currentTime) {
    return { locked: false }
  }

  return {
    locked: true,
    retryAfterSeconds: Math.max(1, Math.ceil((state.lockedUntil - currentTime) / 1000)),
  }
}

export const recordLoginFailure = (ip: string, email: string): void => {
  const currentTime = now()
  cleanupLoginFailures(currentTime)

  const key = `${ip}:${email.toLowerCase()}`
  const state = loginFailureState.get(key)

  if (!state || currentTime - state.windowStartedAt > LOCKOUT_WINDOW_MS) {
    loginFailureState.set(key, {
      failedCount: 1,
      windowStartedAt: currentTime,
      lockedUntil: 0,
    })
    return
  }

  state.failedCount += 1
  if (state.failedCount >= LOCKOUT_AFTER_FAILURES) {
    state.lockedUntil = currentTime + LOCKOUT_DURATION_MS
  }
}

export const clearLoginFailures = (ip: string, email: string): void => {
  const key = `${ip}:${email.toLowerCase()}`
  loginFailureState.delete(key)
}
