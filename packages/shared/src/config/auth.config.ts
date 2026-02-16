import { Config, Effect, Redacted } from 'effect'

const hasWeakSecretShape = (value: string): boolean => {
  const normalized = value.trim().toLowerCase()
  if (normalized.length < 32) {
    return true
  }

  return (
    normalized.includes('replace_with') ||
    normalized.includes('change-in-production') ||
    normalized.includes('your-') ||
    normalized.includes('secret') ||
    normalized.includes('changeme')
  )
}

export class AuthConfig extends Effect.Service<AuthConfig>()('AuthConfig', {
  effect: Effect.gen(function* () {
    const secret = yield* Config.redacted('AUTH_SECRET')
    const jwtSecret = yield* Config.redacted('JWT_SECRET')
    const jwtExpiresIn = yield* Config.string('JWT_EXPIRES_IN').pipe(Config.withDefault('7d'))
    const nodeEnv = yield* Config.string('NODE_ENV').pipe(Config.withDefault('development'))

    const decodedSecret = Redacted.value(secret)
    const decodedJwtSecret = Redacted.value(jwtSecret)

    if (nodeEnv === 'production') {
      if (hasWeakSecretShape(decodedSecret)) {
        return yield* Effect.fail(new Error('AUTH_SECRET is weak or placeholder in production'))
      }

      if (hasWeakSecretShape(decodedJwtSecret)) {
        return yield* Effect.fail(new Error('JWT_SECRET is weak or placeholder in production'))
      }
    }

    return {
      secret: decodedSecret,
      jwtSecret: decodedJwtSecret,
      jwtExpiresIn,
    }
  }),
}) {}
