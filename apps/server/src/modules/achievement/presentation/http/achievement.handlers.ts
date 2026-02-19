import { Effect, Context } from 'effect'
import type { AchievementService } from '../../application/services/achievement.service'
import { AchievementNotFoundError } from '../../domain/errors/achievement.errors'

export class AchievementServiceContext extends Context.Tag('AchievementServiceContext')<
  AchievementServiceContext,
  AchievementService
>() {}

export const getAllAchievementsHandler = (): Effect.Effect<
  { status: number; body: unknown },
  never,
  AchievementServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* AchievementServiceContext
    const achievements = yield* service.getAllAchievements()
    
    return {
      status: 200,
      body: { achievements },
    }
  }).pipe(Effect.catchAll(() => Effect.succeed({ status: 500, body: { error: 'Internal server error' } })))

export const getPlayerAchievementsHandler = (playerId: string): Effect.Effect<
  { status: number; body: unknown },
  never,
  AchievementServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* AchievementServiceContext
    const achievements = yield* service.getPlayerAchievements(playerId)
    
    return {
      status: 200,
      body: { achievements },
    }
  }).pipe(Effect.catchAll(() => Effect.succeed({ status: 500, body: { error: 'Internal server error' } })))

export const getAchievementProgressHandler = (playerId: string): Effect.Effect<
  { status: number; body: unknown },
  never,
  AchievementServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* AchievementServiceContext
    const achievements = yield* service.getPlayerAchievements(playerId)
    
    const progress = achievements.map(pa => ({
      achievementId: pa.achievementId,
      name: pa.achievement.name,
      progress: pa.progress,
      unlockedAt: pa.unlockedAt,
    }))
    
    return {
      status: 200,
      body: { progress },
    }
  }).pipe(Effect.catchAll(() => Effect.succeed({ status: 500, body: { error: 'Internal server error' } })))
