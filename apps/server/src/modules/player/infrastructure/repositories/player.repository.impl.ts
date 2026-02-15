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

export const PlayerRepositoryLive = Layer.effect(
  PlayerRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService

    const findByUserId = (userId: string) =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('players')
          .where('user_id', '=', userId)
          .selectAll()
          .executeTakeFirst()
        return row ? mapPlayerRowToEntity(row as unknown as PlayerRow) : null
      }).pipe(Effect.orDie)

    const findById = (playerId: string) =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('players')
          .where('id', '=', playerId)
          .selectAll()
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
            .returningAll()
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
            .returningAll()
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
          .selectAll()
          .executeTakeFirst()
        return row ? mapPlayerStatsRowToEntity(row as unknown as PlayerStatsDbType) : null
      }).pipe(Effect.orDie)

    const getProgression = (playerId: string) =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('player_progression')
          .where('player_id', '=', playerId)
          .selectAll()
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
          .returningAll()
          .executeTakeFirst()

        if (row) {
          return mapPlayerStatsRowToEntity(row as unknown as PlayerStatsDbType)
        }

        const existing = await db
          .selectFrom('player_stats')
          .where('player_id', '=', playerId)
          .selectAll()
          .executeTakeFirstOrThrow()
        return mapPlayerStatsRowToEntity(existing as unknown as PlayerStatsDbType)
      }).pipe(Effect.orDie)

    const createProgression = (playerId: string) =>
      Effect.promise(async () => {
        const row = await db
          .insertInto('player_progression')
          .values({ player_id: playerId })
          .onConflict((oc) => oc.column('player_id').doNothing())
          .returningAll()
          .executeTakeFirst()

        if (row) {
          return mapPlayerProgressionRowToEntity(row as unknown as PlayerProgressionDbType)
        }

        const existing = await db
          .selectFrom('player_progression')
          .where('player_id', '=', playerId)
          .selectAll()
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
