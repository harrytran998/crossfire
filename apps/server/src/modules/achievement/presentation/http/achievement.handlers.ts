import { Effect, Context } from 'effect'
import type { AchievementService } from '../../application/services/achievement.service'
import { CurrentAuth } from '../../../auth/presentation/http/auth.routes'
import { ForbiddenError } from '../../../auth/domain/errors/auth.errors'

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
  }).pipe(
    Effect.catchAll(() => Effect.succeed({ status: 500, body: { error: 'Internal server error' } }))
  )

export const getPlayerAchievementsHandler = (
  playerId: string
): Effect.Effect<
  { status: number; body: unknown },
  never,
  AchievementServiceContext | CurrentAuth
> =>
  Effect.gen(function* () {
    const { user } = yield* CurrentAuth

    // Authorization: Users can only access their own achievements, or admins can access any
    if (user.id !== playerId && user.role !== 'admin') {
      return yield* Effect.fail(
        new ForbiddenError({ message: 'Can only access your own achievements' })
      )
    }

    const service = yield* AchievementServiceContext
    const achievements = yield* service.getPlayerAchievements(playerId)

    return {
      status: 200,
      body: { achievements },
    }
  }).pipe(
    Effect.catchAll((error) => {
      if (error instanceof ForbiddenError) {
        return Effect.succeed({ status: 403, body: { error: error.message } })
      }
      return Effect.succeed({ status: 500, body: { error: 'Internal server error' } })
    })
  )

export const getAchievementProgressHandler = (
  playerId: string
): Effect.Effect<
  { status: number; body: unknown },
  never,
  AchievementServiceContext | CurrentAuth
> =>
  Effect.gen(function* () {
    const { user } = yield* CurrentAuth

    if (user.id !== playerId && user.role !== 'admin') {
      return yield* Effect.fail(
        new ForbiddenError({ message: 'Can only access your own achievement progress' })
      )
    }

    const service = yield* AchievementServiceContext
    const achievements = yield* service.getPlayerAchievements(playerId)

    const progress = achievements.map((pa) => ({
      achievementId: pa.achievementId,
      name: pa.achievement.name,
      progress: pa.progress,
      unlockedAt: pa.unlockedAt,
    }))

    return {
      status: 200,
      body: { progress },
    }
  }).pipe(
    Effect.catchAll((error) => {
      if (error instanceof ForbiddenError) {
        return Effect.succeed({ status: 403, body: { error: error.message } })
      }
      return Effect.succeed({ status: 500, body: { error: 'Internal server error' } })
    })
  )
