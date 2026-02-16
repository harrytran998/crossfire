import { Context, Effect, Layer } from 'effect'
import { DatabaseService } from '../../../../services/database.service'
import type { LoadoutRepository as LoadoutRepositoryType } from '../../domain/repositories/loadout.repository'
import type {
  CreateLoadoutInput,
  PlayerLoadoutRow,
  UpdateLoadoutInput,
} from '../../domain/entities/loadout.entity'
import { mapPlayerLoadoutRowToEntity } from '../../domain/entities/loadout.entity'
import { LoadoutNotFoundError, LoadoutSlotTakenError } from '../../domain/errors/loadout.errors'

export const LoadoutRepository = Context.GenericTag<LoadoutRepositoryType>('LoadoutRepository')

const columns = [
  'id',
  'player_id',
  'name',
  'slot',
  'is_default',
  'primary_weapon_id',
  'secondary_weapon_id',
  'melee_weapon_id',
  'frag_grenades',
  'flash_grenades',
  'smoke_grenades',
  'primary_attachments',
  'secondary_attachments',
  'created_at',
  'updated_at',
] as const

export const LoadoutRepositoryLive = Layer.effect(
  LoadoutRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService

    const listByPlayerId: LoadoutRepositoryType['listByPlayerId'] = (playerId) =>
      Effect.promise(async () => {
        const rows = await db
          .selectFrom('player_loadouts')
          .select(columns)
          .where('player_id', '=', playerId)
          .orderBy('slot', 'asc')
          .execute()
        return rows.map((row) => mapPlayerLoadoutRowToEntity(row as unknown as PlayerLoadoutRow))
      }).pipe(Effect.orDie)

    const findById: LoadoutRepositoryType['findById'] = (loadoutId) =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('player_loadouts')
          .select(columns)
          .where('id', '=', loadoutId)
          .executeTakeFirst()
        return row ? mapPlayerLoadoutRowToEntity(row as unknown as PlayerLoadoutRow) : null
      }).pipe(Effect.orDie)

    const create: LoadoutRepositoryType['create'] = (input: CreateLoadoutInput) =>
      Effect.gen(function* () {
        const row = yield* Effect.promise(async () => {
          return db.transaction().execute(async (trx) => {
            if (input.isDefault) {
              await trx
                .updateTable('player_loadouts')
                .set({ is_default: false, updated_at: new Date() })
                .where('player_id', '=', input.playerId)
                .execute()
            }

            return trx
              .insertInto('player_loadouts')
              .values({
                player_id: input.playerId,
                name: input.name,
                slot: input.slot,
                is_default: input.isDefault ?? false,
                primary_weapon_id: input.primaryWeaponId ?? null,
                secondary_weapon_id: input.secondaryWeaponId ?? null,
                melee_weapon_id: input.meleeWeaponId ?? null,
                frag_grenades: input.fragGrenades ?? 1,
                flash_grenades: input.flashGrenades ?? 1,
                smoke_grenades: input.smokeGrenades ?? 0,
                primary_attachments: input.primaryAttachments ? [...input.primaryAttachments] : [],
                secondary_attachments: input.secondaryAttachments ? [...input.secondaryAttachments] : [],
              })
              .returning(columns)
              .executeTakeFirstOrThrow()
          })
        }).pipe(Effect.mapError(() => new LoadoutSlotTakenError({ slot: input.slot })))

        return mapPlayerLoadoutRowToEntity(row as unknown as PlayerLoadoutRow)
      })

    const update: LoadoutRepositoryType['update'] = (loadoutId, input: UpdateLoadoutInput) =>
      Effect.gen(function* () {
        const existing = yield* findById(loadoutId)
        if (!existing) {
          return yield* Effect.fail(new LoadoutNotFoundError({ loadoutId }))
        }

        const row = yield* Effect.promise(async () => {
          return db.transaction().execute(async (trx) => {
            if (input.isDefault === true) {
              await trx
                .updateTable('player_loadouts')
                .set({ is_default: false, updated_at: new Date() })
                .where('player_id', '=', existing.playerId)
                .where('id', '!=', loadoutId)
                .execute()
            }

            return trx
              .updateTable('player_loadouts')
              .set({
                name: input.name,
                slot: input.slot,
                is_default: input.isDefault,
                primary_weapon_id:
                  input.primaryWeaponId === undefined ? undefined : input.primaryWeaponId,
                secondary_weapon_id:
                  input.secondaryWeaponId === undefined ? undefined : input.secondaryWeaponId,
                melee_weapon_id: input.meleeWeaponId === undefined ? undefined : input.meleeWeaponId,
                frag_grenades: input.fragGrenades,
                flash_grenades: input.flashGrenades,
                smoke_grenades: input.smokeGrenades,
                primary_attachments:
                  input.primaryAttachments === undefined
                    ? undefined
                    : [...input.primaryAttachments],
                secondary_attachments:
                  input.secondaryAttachments === undefined
                    ? undefined
                    : [...input.secondaryAttachments],
                updated_at: new Date(),
              })
              .where('id', '=', loadoutId)
              .where('player_id', '=', existing.playerId)
              .returning(columns)
              .executeTakeFirst()
          })
        }).pipe(
          Effect.mapError(() =>
            new LoadoutSlotTakenError({ slot: input.slot ?? existing.slot })
          )
        )

        if (!row) {
          return yield* Effect.fail(new LoadoutNotFoundError({ loadoutId }))
        }

        return mapPlayerLoadoutRowToEntity(row as unknown as PlayerLoadoutRow)
      })

    const remove: LoadoutRepositoryType['remove'] = (loadoutId) =>
      Effect.gen(function* () {
        const deleted = yield* Effect.promise(async () => {
          return db
            .deleteFrom('player_loadouts')
            .where('id', '=', loadoutId)
            .returning(['id'])
            .executeTakeFirst()
        }).pipe(Effect.orDie)

        if (!deleted) {
          return yield* Effect.fail(new LoadoutNotFoundError({ loadoutId }))
        }
      })

    return LoadoutRepository.of({
      listByPlayerId,
      findById,
      create,
      update,
      remove,
    })
  })
)
