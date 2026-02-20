export type AchievementCategory = 'combat' | 'social' | 'progression' | 'special' | 'hidden'

export interface Achievement {
  readonly id: string
  readonly achievementKey: string
  readonly name: string
  readonly description: string | null
  readonly category: AchievementCategory
  readonly xpReward: number
  readonly iconUrl: string | null
  readonly sortOrder: number
  readonly isHidden: boolean
  readonly createdAt: Date
}

export interface AchievementCriteria {
  readonly id: string
  readonly achievementId: string
  readonly conditionKey: string
  readonly targetValue: number
  readonly operator: string
  readonly gameMode: string | null
  readonly weaponType: string | null
  readonly createdAt: Date
}

export interface PlayerAchievement {
  readonly playerId: string
  readonly achievementId: string
  readonly progress: Record<string, number>
  readonly unlockedAt: Date
}

export interface AchievementWithCriteria extends Achievement {
  readonly criteria: AchievementCriteria[]
}

export interface PlayerAchievementWithDetails extends PlayerAchievement {
  readonly achievement: Achievement
  readonly criteria: AchievementCriteria[]
}

export interface AchievementProgress {
  readonly achievementId: string
  readonly currentProgress: Record<string, number>
  readonly targetValue: number
  readonly isCompleted: boolean
}
