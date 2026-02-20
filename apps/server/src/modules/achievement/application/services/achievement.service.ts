import { Context, Effect, Layer } from 'effect'
import type {
  Achievement,
  PlayerAchievementWithDetails,
} from '../../domain/entities/achievement.entity'
import { AchievementNotFoundError } from '../../domain/errors/achievement.errors'
import type { AchievementError } from '../../domain/errors/achievement.errors'
import {
  AchievementRepository,
  AchievementRepositoryLive,
} from '../../infrastructure/repositories/achievement.repository.impl'

export interface AchievementService {
  readonly getAllAchievements: () => Effect.Effect<Achievement[], AchievementError>
  readonly getPlayerAchievements: (
    playerId: string
  ) => Effect.Effect<PlayerAchievementWithDetails[], AchievementError>
  readonly checkAndUnlockAchievements: (
    playerId: string,
    conditionKey: string,
    currentValue: number
  ) => Effect.Effect<Achievement[], AchievementError>
  readonly updateProgress: (
    playerId: string,
    achievementId: string,
    progressData: Record<string, number>
  ) => Effect.Effect<void, AchievementError>
}

export const AchievementService = Context.GenericTag<AchievementService>('AchievementService')

export const AchievementServiceLive = Layer.effect(
  AchievementService,
  Effect.gen(function* () {
    const repo = yield* AchievementRepository

    const getAllAchievements = () => repo.findAll()

    const getPlayerAchievements = (playerId: string) => repo.findPlayerAchievements(playerId)

    const checkAndUnlockAchievements = (
      playerId: string,
      conditionKey: string,
      currentValue: number
    ) =>
      Effect.gen(function* () {
        const allAchievements = yield* repo.findAllWithCriteria()
        const playerAchievements = yield* repo.findPlayerAchievements(playerId)

        const newlyUnlocked: Achievement[] = []

        for (const achievement of allAchievements) {
          const alreadyUnlocked = playerAchievements.some(
            (pa) => pa.achievementId === achievement.id
          )
          if (alreadyUnlocked) continue

          const matchingCriteria = achievement.criteria.filter(
            (c) => c.conditionKey === conditionKey
          )
          if (matchingCriteria.length === 0) continue

          for (const criteria of matchingCriteria) {
            const operator = criteria.operator || '>='
            const shouldUnlock = evaluateOperator(currentValue, criteria.targetValue, operator)

            if (shouldUnlock) {
              const existingProgress = yield* repo.findPlayerAchievement(playerId, achievement.id)

              if (!existingProgress) {
                yield* repo.createPlayerAchievement(playerId, achievement.id, {
                  [conditionKey]: currentValue,
                })
              }

              yield* repo.unlockAchievement(playerId, achievement.id)
              newlyUnlocked.push(achievement)
              break
            } else {
              const existingProgress = yield* repo.findPlayerAchievement(playerId, achievement.id)
              if (existingProgress) {
                yield* repo.updatePlayerProgress(playerId, achievement.id, {
                  ...existingProgress.progress,
                  [conditionKey]: currentValue,
                })
              } else {
                yield* repo.createPlayerAchievement(playerId, achievement.id, {
                  [conditionKey]: currentValue,
                })
              }
            }
          }
        }

        return newlyUnlocked
      })

    const updateProgress = (
      playerId: string,
      achievementId: string,
      progressData: Record<string, number>
    ) =>
      Effect.gen(function* () {
        const achievement = yield* repo.findById(achievementId)
        if (!achievement) {
          return yield* Effect.fail(new AchievementNotFoundError({ achievementId }))
        }

        const existingProgress = yield* repo.findPlayerAchievement(playerId, achievementId)
        if (existingProgress) {
          yield* repo.updatePlayerProgress(playerId, achievementId, {
            ...existingProgress.progress,
            ...progressData,
          })
        } else {
          yield* repo.createPlayerAchievement(playerId, achievementId, progressData)
        }
      })

    return AchievementService.of({
      getAllAchievements,
      getPlayerAchievements,
      checkAndUnlockAchievements,
      updateProgress,
    })
  })
).pipe(Layer.provide(AchievementRepositoryLive))

function evaluateOperator(current: number, target: number, operator: string): boolean {
  switch (operator) {
    case '>=':
      return current >= target
    case '>':
      return current > target
    case '=':
      return current === target
    case '<=':
      return current <= target
    case '<':
      return current < target
    default:
      return current >= target
  }
}
