import { Context, Effect, Layer } from 'effect'
import { DatabaseService } from '../../../../services/database.service'
import type { StaticDataRepository as StaticDataRepositoryType } from '../../domain/repositories/static-data.repository'
import {
  mapMapRowToEntity,
  mapWeaponAttachmentRowToEntity,
  mapWeaponRowToEntity,
  type MapRow,
  type WeaponAttachmentRow,
  type WeaponRow,
} from '../../domain/entities/static-data.entity'

export const StaticDataRepository =
  Context.GenericTag<StaticDataRepositoryType>('StaticDataRepository')

export const StaticDataRepositoryLive = Layer.effect(
  StaticDataRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService

    const getActiveWeapons = () =>
      Effect.promise(async () => {
        const rows = await db
          .selectFrom('weapons')
          .where('is_active', '=', true)
          .orderBy('unlock_level', 'asc')
          .orderBy('name', 'asc')
          .selectAll()
          .execute()
        return rows.map((row) => mapWeaponRowToEntity(row as unknown as WeaponRow))
      }).pipe(Effect.orDie)

    const getWeaponByKey = (weaponKey: string) =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('weapons')
          .where('weapon_key', '=', weaponKey)
          .where('is_active', '=', true)
          .selectAll()
          .executeTakeFirst()
        return row ? mapWeaponRowToEntity(row as unknown as WeaponRow) : null
      }).pipe(Effect.orDie)

    const getWeaponAttachments = (weaponId: string) =>
      Effect.promise(async () => {
        const rows = await db
          .selectFrom('weapon_attachments')
          .where('weapon_id', '=', weaponId)
          .where('is_active', '=', true)
          .orderBy('unlock_level', 'asc')
          .orderBy('name', 'asc')
          .selectAll()
          .execute()
        return rows.map((row) =>
          mapWeaponAttachmentRowToEntity(row as unknown as WeaponAttachmentRow)
        )
      }).pipe(Effect.orDie)

    const getActiveMaps = () =>
      Effect.promise(async () => {
        const rows = await db
          .selectFrom('maps')
          .where('is_active', '=', true)
          .orderBy('name', 'asc')
          .selectAll()
          .execute()
        return rows.map((row) => mapMapRowToEntity(row as unknown as MapRow))
      }).pipe(Effect.orDie)

    return StaticDataRepository.of({
      getActiveWeapons,
      getWeaponByKey,
      getWeaponAttachments,
      getActiveMaps,
    })
  })
)
