import { Context, Effect, Layer, Option, Schedule, pipe } from 'effect'
import { MatchmakingRepository } from '../domain/matchmaking.repository'
import { 
  QueueEntry, 
  Match, 
  MatchmakingError,
  type MatchmakingErrorCode 
} from '../domain/matchmaking'
import { RoomService } from './room.service'
import * as UUID from 'uuid'

export interface MatchmakingService {
  readonly enqueue: (
    playerId: string, 
    gameMode: string, 
    skillRating: number,
    timeoutSeconds?: number
  ) => Effect.Effect<QueueEntry, MatchmakingError>
  
  readonly dequeue: (playerId: string) => Effect.Effect<void, MatchmakingError>
  readonly getStatus: (playerId: string) => Effect.Effect<Option<QueueEntry>, never>
  readonly findMatches: () => Effect.Effect<Match[], never>
}

export const MatchmakingService = Context.Tag<MatchmakingService>()

interface MatchmakingConfig {
  readonly initialSkillRange: number
  readonly skillRangeExpansion: number
  readonly expansionIntervalMs: number
  readonly maxSkillRange: number
  readonly matchSize: number
}

const defaultConfig: MatchmakingConfig = {
  initialSkillRange: 100,
  skillRangeExpansion: 50,
  expansionIntervalMs: 5000,
  maxSkillRange: 500,
  matchSize: 2
}

export const MatchmakingServiceLive = Layer.effect(
  MatchmakingService,
  Effect.gen(function* () {
    const repository = yield* MatchmakingRepository
    const roomService = yield* RoomService
    const config = defaultConfig

    const fail = (reason: string, code: MatchmakingErrorCode) => Effect.fail(new MatchmakingError(reason, code))

    const calculateSkillRange = (elapsedMs: number): number => {
      const expansions = Math.floor(elapsedMs / config.expansionIntervalMs)
      const range = config.initialSkillRange + (expansions * config.skillRangeExpansion)
      return Math.min(range, config.maxSkillRange)
    }

    const findMatchForPlayer = (entry: QueueEntry, queue: QueueEntry[]): QueueEntry[] => {
      const elapsed = Date.now() - entry.joinedAt
      const skillRange = calculateSkillRange(elapsed)
      
      const candidates = queue
        .filter(e => 
          e.playerId !== entry.playerId &&
          Math.abs(e.skillRating - entry.skillRating) <= skillRange
        )
        .sort((a, b) => {
          const aDiff = Math.abs(a.skillRating - entry.skillRating)
          const bDiff = Math.abs(b.skillRating - entry.skillRating)
          return aDiff - bDiff
        })

      if (candidates.length >= config.matchSize - 1) {
        return [entry, ...candidates.slice(0, config.matchSize - 1)]
      }

      return []
    }

    return {
      enqueue: (playerId: string, gameMode: string, skillRating: number, timeoutSeconds = 300) =>
        Effect.gen(function* () {
          const existing = yield* repository.getEntry(playerId)
          if (Option.isSome(existing)) {
            return yield* fail('Already in queue', 'ALREADY_IN_QUEUE')
          }

          const now = Date.now()
          const entry: QueueEntry = {
            id: UUID.v4(),
            playerId,
            gameMode,
            skillRating,
            joinedAt: now,
            timeoutAt: now + (timeoutSeconds * 1000)
          }

          yield* repository.enqueue(entry)
          return entry
        }),

      dequeue: (playerId: string) =>
        repository.dequeue(playerId),

      getStatus: (playerId: string) =>
        repository.getEntry(playerId),

      findMatches: () =>
        Effect.gen(function* () {
          const gameModes = ['deathmatch', 'team_deathmatch', 'capture_the_flag']
          const createdMatches: Match[] = []

          for (const gameMode of gameModes) {
            const queue = yield* repository.getQueueForMode(gameMode)
            const matchedPlayerIds = new Set<string>()

            for (const entry of queue) {
              if (matchedPlayerIds.has(entry.playerId)) continue
              if (entry.timeoutAt < Date.now()) continue

              const match = findMatchForPlayer(entry, queue.filter(e => !matchedPlayerIds.has(e.playerId)))
              
              if (match.length >= config.matchSize) {
                const newMatch: Match = {
                  id: UUID.v4(),
                  gameMode,
                  playerIds: match.map(m => m.playerId),
                  createdAt: Date.now()
                }

                yield* repository.createMatch(newMatch)
                createdMatches.push(newMatch)

                for (const m of match) {
                  matchedPlayerIds.add(m.playerId)
                  yield* repository.dequeue(m.playerId)
                }

                // Create room for the match
                yield* roomService.createRoom({
                  name: `Match ${newMatch.id.slice(0, 8)}`,
                  hostId: newMatch.playerIds[0],
                  hostUsername: 'Player',
                  maxPlayers: config.matchSize,
                  gameMode,
                  isPublic: false
                })
              }
            }
          }

          // Clean up expired entries
          yield* repository.removeExpired(Date.now())

          return createdMatches
        })
    }
  })
)

// Background matchmaking worker
export const startMatchmakingWorker = () =>
  pipe(
    Effect.gen(function* () {
      const service = yield* MatchmakingService
      yield* service.findMatches()
    }),
    Effect.repeat(Schedule.spaced(2000)),
    Effect.forkDaemon
  )
