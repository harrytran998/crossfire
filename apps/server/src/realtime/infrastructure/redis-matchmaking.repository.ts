import { Effect, Layer, Option } from 'effect'
import { MatchmakingRepository } from '../domain/matchmaking.repository'
import { QueueEntry, Match, MatchmakingError } from '../domain/matchmaking'
import { RedisService } from '../../../services/redis.service'
import * as UUID from 'uuid'

const QUEUE_KEY = (gameMode: string) => `matchmaking:queue:${gameMode}`
const PLAYER_QUEUE_KEY = (playerId: string) => `matchmaking:player:${playerId}`
const MATCH_KEY = (id: string) => `match:${id}`

export const RedisMatchmakingRepositoryLive = Layer.effect(
  MatchmakingRepository,
  Effect.gen(function* () {
    const redis = yield* RedisService

    const serialize = (data: unknown): string => JSON.stringify(data)
    const deserialize = <T>(data: string): T => JSON.parse(data)

    return {
      enqueue: (entry: QueueEntry) =>
        Effect.gen(function* () {
          yield* redis.zadd(QUEUE_KEY(entry.gameMode), entry.skillRating, serialize(entry))
          yield* redis.set(PLAYER_QUEUE_KEY(entry.playerId), serialize(entry))
        }),

      dequeue: (playerId: string) =>
        Effect.gen(function* () {
          const entryOpt = yield* Effect.gen(function* () {
            const data = yield* redis.get(PLAYER_QUEUE_KEY(playerId))
            if (!data) return Option.none()
            return Option.some(deserialize<QueueEntry>(data))
          })

          if (Option.isNone(entryOpt)) {
            return yield* Effect.fail(
              new MatchmakingError('Not in queue', 'NOT_IN_QUEUE')
            )
          }

          const entry = entryOpt.value
          yield* redis.zrem(QUEUE_KEY(entry.gameMode), serialize(entry))
          yield* redis.del(PLAYER_QUEUE_KEY(playerId))
        }),

      getEntry: (playerId: string) =>
        Effect.gen(function* () {
          const data = yield* redis.get(PLAYER_QUEUE_KEY(playerId))
          if (!data) return Option.none()
          return Option.some(deserialize<QueueEntry>(data))
        }),

      getQueueForMode: (gameMode: string) =>
        Effect.gen(function* () {
          const entries = yield* redis.zrange(QUEUE_KEY(gameMode), 0, -1)
          return entries.map(e => deserialize<QueueEntry>(e))
        }),

      getQueueLength: (gameMode: string) =>
        Effect.gen(function* () {
          return yield* redis.zcard(QUEUE_KEY(gameMode))
        }),

      removeExpired: (before: number) =>
        Effect.gen(function* () {
          const allKeys = yield* redis.keys('matchmaking:player:*')
          const removed: string[] = []

          for (const key of allKeys) {
            const data = yield* redis.get(key)
            if (data) {
              const entry = deserialize<QueueEntry>(data)
              if (entry.timeoutAt < before) {
                yield* redis.zrem(QUEUE_KEY(entry.gameMode), serialize(entry))
                yield* redis.del(key)
                removed.push(entry.playerId)
              }
            }
          }

          return removed
        }),

      createMatch: (match: Match) =>
        Effect.gen(function* () {
          yield* redis.set(MATCH_KEY(match.id), serialize(match))
          return match
        }),

      getMatch: (matchId: string) =>
        Effect.gen(function* () {
          const data = yield* redis.get(MATCH_KEY(matchId))
          if (!data) return Option.none()
          return Option.some(deserialize<Match>(data))
        })
    }
  })
)
