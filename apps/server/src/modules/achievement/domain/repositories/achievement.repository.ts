import { Effect } from 'effect'
import type {
  Achievement,
  PlayerAchievement,
  AchievementWithCriteria,
  PlayerAchievementWithDetails,
} from '../entities/achievement.entity'
import type { AchievementError } from '../errors/achievement.errors'

export interface AchievementRepository {
  readonly findAll: () => Effect.Effect<Achievement[], AchievementError>
  readonly findById: (id: string) => Effect.Effect<Achievement | null, AchievementError>
  readonly findByKey: (key: string) => Effect.Effect<Achievement | null, AchievementError>
  readonly findWithCriteria: (
    id: string
  ) => Effect.Effect<AchievementWithCriteria | null, AchievementError>
  readonly findAllWithCriteria: () => Effect.Effect<AchievementWithCriteria[], AchievementError>
  readonly findPlayerAchievements: (
    playerId: string
  ) => Effect.Effect<PlayerAchievementWithDetails[], AchievementError>
  readonly findPlayerAchievement: (
    playerId: string,
    achievementId: string
  ) => Effect.Effect<PlayerAchievement | null, AchievementError>
  readonly createPlayerAchievement: (
    playerId: string,
    achievementId: string,
    progress?: Record<string, number>
  ) => Effect.Effect<PlayerAchievement, AchievementError>
  readonly updatePlayerProgress: (
    playerId: string,
    achievementId: string,
    progress: Record<string, number>
  ) => Effect.Effect<void, AchievementError>
  readonly unlockAchievement: (
    playerId: string,
    achievementId: string
  ) => Effect.Effect<void, AchievementError>
}
