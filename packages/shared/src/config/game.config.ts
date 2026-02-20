import { Config } from 'effect'

export interface GameConfig {
  readonly roomTtlSeconds: number
  readonly roomMaxConcurrency: number
  readonly matchmakingMaxConcurrency: number
  readonly leaderboardMaxDefinitions: number
  readonly staticDataCacheTtlSeconds: number
  readonly leaderboardCacheTtlSeconds: number
}

export const GameConfig = Config.nested(
  Config.all({
    roomTtlSeconds: Config.number('ROOM_TTL_SECONDS').pipe(Config.withDefault(3600)),
    roomMaxConcurrency: Config.number('ROOM_MAX_CONCURRENCY').pipe(Config.withDefault(5)),
    matchmakingMaxConcurrency: Config.number('MATCHMAKING_MAX_CONCURRENCY').pipe(Config.withDefault(5)),
    leaderboardMaxDefinitions: Config.number('LEADERBOARD_MAX_DEFINITIONS').pipe(Config.withDefault(5)),
    staticDataCacheTtlSeconds: Config.number('STATIC_DATA_CACHE_TTL_SECONDS').pipe(Config.withDefault(3600)),
    leaderboardCacheTtlSeconds: Config.number('LEADERBOARD_CACHE_TTL_SECONDS').pipe(Config.withDefault(300)),
  }),
  'game'
)
