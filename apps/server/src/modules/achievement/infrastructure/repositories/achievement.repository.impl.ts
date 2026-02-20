import { Context, Effect, Layer } from 'effect'
import { DatabaseService } from '../../../../services/database.service'
import type { AchievementRepository as AchievementRepositoryType } from '../../domain/repositories/achievement.repository'
import type { Achievement, PlayerAchievement } from '../../domain/entities/achievement.entity'

export const AchievementRepository =
  Context.GenericTag<AchievementRepositoryType>('AchievementRepository')

const achievementColumns = [
  'id',
  'achievement_key',
  'name',
  'description',
  'category',
  'xp_reward',
  'icon_url',
  'sort_order',
  'is_hidden',
  'created_at',
] as const

const criteriaColumns = [
  'id',
  'achievement_id',
  'condition_key',
  'target_value',
  'operator',
  'game_mode',
  'weapon_type',
  'created_at',
] as const

const playerAchievementColumns = ['player_id', 'achievement_id', 'progress', 'unlocked_at'] as const

const mapAchievementRow = (row: Record<string, unknown>): Achievement => ({
  id: String(row.id),
  achievementKey: String(row.achievement_key),
  name: String(row.name),
  description: row.description ? String(row.description) : null,
  category: String(row.category) as Achievement['category'],
  xpReward: Number(row.xp_reward),
  iconUrl: row.icon_url ? String(row.icon_url) : null,
  sortOrder: Number(row.sort_order),
  isHidden: Boolean(row.is_hidden),
  createdAt: new Date(String(row.created_at)),
})

const mapCriteriaRow = (row: Record<string, unknown>) => ({
  id: String(row.id),
  achievementId: String(row.achievement_id),
  conditionKey: String(row.condition_key),
  targetValue: Number(row.target_value),
  operator: String(row.operator),
  gameMode: row.game_mode ? String(row.game_mode) : null,
  weaponType: row.weapon_type ? String(row.weapon_type) : null,
  createdAt: new Date(String(row.created_at)),
})

const mapPlayerAchievementRow = (row: Record<string, unknown>): PlayerAchievement => ({
  playerId: String(row.player_id),
  achievementId: String(row.achievement_id),
  progress: (row.progress as Record<string, number>) || {},
  unlockedAt: new Date(String(row.unlocked_at)),
})

export const AchievementRepositoryLive = Layer.effect(
  AchievementRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService

    const findAll = () =>
      Effect.promise(async () => {
        const rows = await db
          .selectFrom('achievements')
          .select(achievementColumns)
          .orderBy('sort_order', 'asc')
          .execute()
        return rows.map(mapAchievementRow)
      }).pipe(Effect.orDie)

    const findById = (id: string) =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('achievements')
          .where('id', '=', id)
          .select(achievementColumns)
          .executeTakeFirst()
        return row ? mapAchievementRow(row) : null
      }).pipe(Effect.orDie)

    const findByKey = (key: string) =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('achievements')
          .where('achievement_key', '=', key)
          .select(achievementColumns)
          .executeTakeFirst()
        return row ? mapAchievementRow(row) : null
      }).pipe(Effect.orDie)

    const findWithCriteria = (id: string) =>
      Effect.promise(async () => {
        const achievement = await db
          .selectFrom('achievements')
          .where('id', '=', id)
          .select(achievementColumns)
          .executeTakeFirst()

        if (!achievement) return null

        const criteria = await db
          .selectFrom('achievement_criteria')
          .where('achievement_id', '=', id)
          .select(criteriaColumns)
          .execute()

        return {
          ...mapAchievementRow(achievement),
          criteria: criteria.map(mapCriteriaRow),
        }
      }).pipe(Effect.orDie)

    const findAllWithCriteria = () =>
      Effect.promise(async () => {
        const achievements = await db
          .selectFrom('achievements')
          .select(achievementColumns)
          .orderBy('sort_order', 'asc')
          .execute()

        const allCriteria = await db
          .selectFrom('achievement_criteria')
          .select(criteriaColumns)
          .execute()

        return achievements.map((ach) => ({
          ...mapAchievementRow(ach),
          criteria: allCriteria.filter((c) => c.achievement_id === ach.id).map(mapCriteriaRow),
        }))
      }).pipe(Effect.orDie)

    const findPlayerAchievements = (playerId: string) =>
      Effect.promise(async () => {
        const playerAchs = await db
          .selectFrom('player_achievements')
          .where('player_id', '=', playerId)
          .select(playerAchievementColumns)
          .execute()

        const achievements = await db
          .selectFrom('achievements')
          .select(achievementColumns)
          .execute()

        const allCriteria = await db
          .selectFrom('achievement_criteria')
          .select(criteriaColumns)
          .execute()

        return playerAchs.map((pa) => {
          const ach = achievements.find((a) => a.id === pa.achievement_id)
          return {
            ...mapPlayerAchievementRow(pa),
            achievement: ach ? mapAchievementRow(ach) : null!,
            criteria: allCriteria
              .filter((c) => c.achievement_id === pa.achievement_id)
              .map(mapCriteriaRow),
          }
        })
      }).pipe(Effect.orDie)

    const findPlayerAchievement = (playerId: string, achievementId: string) =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('player_achievements')
          .where('player_id', '=', playerId)
          .where('achievement_id', '=', achievementId)
          .select(playerAchievementColumns)
          .executeTakeFirst()
        return row ? mapPlayerAchievementRow(row) : null
      }).pipe(Effect.orDie)

    const createPlayerAchievement = (
      playerId: string,
      achievementId: string,
      progress?: Record<string, number>
    ) =>
      Effect.promise(async () => {
        const row = await db
          .insertInto('player_achievements')
          .values({
            player_id: playerId,
            achievement_id: achievementId,
            progress: progress || {},
          })
          .returning(playerAchievementColumns)
          .executeTakeFirstOrThrow()
        return mapPlayerAchievementRow(row)
      }).pipe(Effect.orDie)

    const updatePlayerProgress = (
      playerId: string,
      achievementId: string,
      progress: Record<string, number>
    ) =>
      Effect.promise(async () => {
        await db
          .updateTable('player_achievements')
          .set({ progress })
          .where('player_id', '=', playerId)
          .where('achievement_id', '=', achievementId)
          .execute()
      }).pipe(Effect.orDie)

    const unlockAchievement = (playerId: string, achievementId: string) =>
      Effect.promise(async () => {
        await db
          .updateTable('player_achievements')
          .set({ unlocked_at: new Date() })
          .where('player_id', '=', playerId)
          .where('achievement_id', '=', achievementId)
          .execute()
      }).pipe(Effect.orDie)

    return AchievementRepository.of({
      findAll,
      findById,
      findByKey,
      findWithCriteria,
      findAllWithCriteria,
      findPlayerAchievements,
      findPlayerAchievement,
      createPlayerAchievement,
      updatePlayerProgress,
      unlockAchievement,
    })
  })
)
