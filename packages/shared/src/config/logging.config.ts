import { Config, Effect } from 'effect'

export class LoggingConfig extends Effect.Service<LoggingConfig>()('LoggingConfig', {
  succeed: Effect.gen(function* () {
    const level = yield* Config.string('LOG_LEVEL').pipe(Config.withDefault('info'))

    return {
      level,
    }
  }),
}) {}
