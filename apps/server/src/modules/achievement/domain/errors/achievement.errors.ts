import { Data } from 'effect'

export class AchievementNotFoundError extends Data.TaggedError('AchievementNotFoundError')<{
  readonly achievementId?: string
}> {}

export class AchievementAlreadyUnlockedError extends Data.TaggedError('AchievementAlreadyUnlockedError')<{
  readonly playerId: string
  readonly achievementId: string
}> {}

export class PlayerAchievementNotFoundError extends Data.TaggedError('PlayerAchievementNotFoundError')<{
  readonly playerId: string
  readonly achievementId: string
}> {}

export type AchievementError =
  | AchievementNotFoundError
  | AchievementAlreadyUnlockedError
  | PlayerAchievementNotFoundError
