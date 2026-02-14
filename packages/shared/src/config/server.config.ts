import { Config, Effect } from 'effect'

export class ServerConfig extends Effect.Service<ServerConfig>()('ServerConfig', {
  succeed: Effect.gen(function* () {
    const host = yield* Config.string('HOST').pipe(Config.withDefault('localhost'))
    const port = yield* Config.integer('PORT').pipe(Config.withDefault(3000))
    const nodeEnv = yield* Config.string('NODE_ENV').pipe(Config.withDefault('development'))
    const gameTickRate = yield* Config.integer('GAME_TICK_RATE').pipe(Config.withDefault(20))
    const maxRooms = yield* Config.integer('MAX_ROOMS').pipe(Config.withDefault(100))
    const maxPlayersPerRoom = yield* Config.integer('MAX_PLAYERS_PER_ROOM').pipe(Config.withDefault(16))

    return {
      host,
      port,
      nodeEnv,
      gameTickRate,
      maxRooms,
      maxPlayersPerRoom,
      isDevelopment: nodeEnv === 'development',
      isProduction: nodeEnv === 'production',
      isTest: nodeEnv === 'test',
    }
  }),
}) {}
