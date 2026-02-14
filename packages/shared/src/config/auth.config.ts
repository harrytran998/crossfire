import { Config, Effect, Redacted } from 'effect'

export class AuthConfig extends Effect.Service<AuthConfig>()('AuthConfig', {
  succeed: Effect.gen(function* () {
    const secret = yield* Config.redacted('AUTH_SECRET')
    const jwtSecret = yield* Config.redacted('JWT_SECRET')
    const jwtExpiresIn = yield* Config.string('JWT_EXPIRES_IN').pipe(Config.withDefault('7d'))

    return {
      secret: Redacted.value(secret),
      jwtSecret: Redacted.value(jwtSecret),
      jwtExpiresIn,
    }
  }),
}) {}
