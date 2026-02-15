import { Config, Effect } from 'effect'

export class LoggingConfig extends Effect.Service<LoggingConfig>()('LoggingConfig', {
  effect: Effect.gen(function* () {
    const level = yield* Config.string('LOG_LEVEL').pipe(Config.withDefault('info'))

    return {
      level,
    }
  }),
}) {}
