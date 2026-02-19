import { Effect, Context } from 'effect'
import { Schema } from 'effect'
import type { MatchmakingService } from '../../application/services/matchmaking.service'
import type { MatchmakingDomainError } from '../../domain/errors/matchmaking.errors'


export const JoinQueueSchema = Schema.Struct({
  gameMode: Schema.String,
  skillRating: Schema.Number,
})

export class MatchmakingServiceContext extends Context.Tag('MatchmakingServiceContext')<
  MatchmakingServiceContext,
  MatchmakingService
>() {}

export const joinQueueHandler = (playerId: string, body: unknown): Effect.Effect<
  { status: number; body: unknown },
  MatchmakingDomainError,
  MatchmakingServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* MatchmakingServiceContext
    const parsed = yield* Effect.try({
      try: () => Schema.decodeUnknownSync(JoinQueueSchema)(body),
      catch: () => new Error('Invalid request body'),
    }).pipe(Effect.catchAll(() => Effect.succeed({ gameMode: 'default', skillRating: 1000 })))
    
    const ticket = yield* service.joinQueue({
      playerId,
      gameMode: parsed.gameMode,
      skillRating: parsed.skillRating,
    })
    
    return {
      status: 201,
      body: {
        ticketId: ticket.id,
        status: ticket.status,
        queuedAt: ticket.queuedAt,
      },
    }
  })

export const leaveQueueHandler = (playerId: string): Effect.Effect<
  { status: number; body: unknown },
  MatchmakingDomainError,
  MatchmakingServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* MatchmakingServiceContext
    yield* service.leaveQueue(playerId)
    
    return {
      status: 200,
      body: { message: 'Left queue successfully' },
    }
  })

export const getQueueStatusHandler = (playerId: string): Effect.Effect<
  { status: number; body: unknown },
  MatchmakingDomainError,
  MatchmakingServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* MatchmakingServiceContext
    const status = yield* service.getQueueStatus(playerId)
    
    if (!status) {
      return {
        status: 404,
        body: { error: 'Not in queue' },
      }
    }
    
    return {
      status: 200,
      body: status,
    }
  })
