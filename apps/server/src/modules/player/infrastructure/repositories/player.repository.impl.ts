import { Context, Effect, Layer } from 'effect'
import { DatabaseService } from '../../../../services/database.service'
import type { PlayerRepository as PlayerRepositoryType } from '../../domain/repositories/player.repository'
import type {
  CreatePlayerInput,
  PlayerRow,
  PlayerStatsDbType,
  PlayerProgressionDbType,
  UpdatePlayerInput,
} from '../../domain/entities/player.entity'
import {
  mapPlayerProgressionRowToEntity,
  mapPlayerRowToEntity,
  mapPlayerStatsRowToEntity,
} from '../../domain/entities/player.entity'
import { PlayerAlreadyExistsError, PlayerNotFoundError } from '../../domain/errors/player.errors'

export const PlayerRepository = Context.GenericTag<PlayerRepositoryType>('PlayerRepository')

const playerColumns = [
  'id',
  'user_id',
  'display_name',
  'avatar_url',
  'bio',
  'region',
  'language',
  'created_at',
  'updated_at',
] as const

const playerStatsColumns = [
  'player_id',
  'total_matches',
  'matches_won',
  'matches_lost',
  'total_kills',
  'total_deaths',
  'total_assists',
  'total_headshots',
  'total_damage_dealt',
  'total_damage_received',
  'total_score',
  'playtime_seconds',
  'last_updated',
] as const

const playerProgressionColumns = [
  'player_id',
  'current_level',
  'current_xp',
  'total_xp',
  'xp_multiplier',
  'xp_booster_expires',
  'last_updated',
] as const

export const PlayerRepositoryLive = Layer.effect(
  PlayerRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService

    const findByUserId = (userId: string) =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('players')
          .where('user_id', '=', userId)
          .select(playerColumns)
          .executeTakeFirst()
        return row ? mapPlayerRowToEntity(row as unknown as PlayerRow) : null
      }).pipe(Effect.orDie)

    const findById = (playerId: string) =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('players')
          .where('id', '=', playerId)
          .select(playerColumns)
          .executeTakeFirst()
        return row ? mapPlayerRowToEntity(row as unknown as PlayerRow) : null
      }).pipe(Effect.orDie)

    const create = (input: CreatePlayerInput) =>
      Effect.gen(function* () {
        const existing = yield* findByUserId(input.userId)
        if (existing) {
          return yield* Effect.fail(new PlayerAlreadyExistsError())
        }

        const row = yield* Effect.promise(async () => {
          return db
            .insertInto('players')
            .values({
              user_id: input.userId,
              display_name: input.displayName,
              region: input.region ?? 'ASIA',
              language: input.language ?? 'en',
            })
            .returning(playerColumns)
            .executeTakeFirstOrThrow()
        }).pipe(Effect.mapError(() => new PlayerAlreadyExistsError()))

        return mapPlayerRowToEntity(row as unknown as PlayerRow)
      })

    const update = (playerId: string, input: UpdatePlayerInput) =>
      Effect.gen(function* () {
        const updates: Record<string, string> = {}
        if (typeof input.displayName === 'string') {
          updates.display_name = input.displayName
        }
        if (typeof input.avatarUrl === 'string') {
          updates.avatar_url = input.avatarUrl
        }
        if (typeof input.bio === 'string') {
          updates.bio = input.bio
        }
        if (typeof input.region === 'string') {
          updates.region = input.region
        }
        if (typeof input.language === 'string') {
          updates.language = input.language
        }

        const row = yield* Effect.promise(async () => {
          return db
            .updateTable('players')
            .set({ ...updates, updated_at: new Date() })
            .where('id', '=', playerId)
            .returning(playerColumns)
            .executeTakeFirst()
        }).pipe(Effect.orDie)

        if (!row) {
          return yield* Effect.fail(new PlayerNotFoundError({ playerId }))
        }

        return mapPlayerRowToEntity(row as unknown as PlayerRow)
      })

    const getStats = (playerId: string) =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('player_stats')
          .where('player_id', '=', playerId)
          .select(playerStatsColumns)
          .executeTakeFirst()
        return row ? mapPlayerStatsRowToEntity(row as unknown as PlayerStatsDbType) : null
      }).pipe(Effect.orDie)

    const getProgression = (playerId: string) =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('player_progression')
          .where('player_id', '=', playerId)
          .select(playerProgressionColumns)
          .executeTakeFirst()
        return row
          ? mapPlayerProgressionRowToEntity(row as unknown as PlayerProgressionDbType)
          : null
      }).pipe(Effect.orDie)

    const createStats = (playerId: string) =>
      Effect.promise(async () => {
        const row = await db
          .insertInto('player_stats')
          .values({ player_id: playerId })
          .onConflict((oc) => oc.column('player_id').doNothing())
          .returning(playerStatsColumns)
          .executeTakeFirst()

        if (row) {
          return mapPlayerStatsRowToEntity(row as unknown as PlayerStatsDbType)
        }

        const existing = await db
          .selectFrom('player_stats')
          .where('player_id', '=', playerId)
          .select(playerStatsColumns)
          .executeTakeFirstOrThrow()
        return mapPlayerStatsRowToEntity(existing as unknown as PlayerStatsDbType)
      }).pipe(Effect.orDie)

    const createProgression = (playerId: string) =>
      Effect.promise(async () => {
        const row = await db
          .insertInto('player_progression')
          .values({ player_id: playerId })
          .onConflict((oc) => oc.column('player_id').doNothing())
          .returning(playerProgressionColumns)
          .executeTakeFirst()

        if (row) {
          return mapPlayerProgressionRowToEntity(row as unknown as PlayerProgressionDbType)
        }

        const existing = await db
          .selectFrom('player_progression')
          .where('player_id', '=', playerId)
          .select(playerProgressionColumns)
          .executeTakeFirstOrThrow()
        return mapPlayerProgressionRowToEntity(existing as unknown as PlayerProgressionDbType)
      }).pipe(Effect.orDie)

    return PlayerRepository.of({
      findByUserId,
      findById,
      create,
      update,
      getStats,
      getProgression,
      createStats,
      createProgression,
    })
  })
)
