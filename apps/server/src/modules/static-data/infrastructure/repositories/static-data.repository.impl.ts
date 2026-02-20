import { Context, Effect, Layer } from 'effect'
import { GameConfig } from '@crossfire/shared'
import { DatabaseService } from '../../../../services/database.service'
import { RedisService } from '../../../../services/redis.service'
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

const CACHE_KEYS = {
  weapons: 'static:weapons',
  weapon: (key: string) => `static:weapon:${key}`,
  attachments: (weaponId: string) => `static:attachments:${weaponId}`,
  maps: 'static:maps',
} as const

const weaponColumns = [
  'id',
  'weapon_key',
  'name',
  'weapon_type',
  'rarity',
  'base_damage',
  'unlock_level',
  'unlock_cost',
  'is_active',
] as const

const weaponAttachmentColumns = [
  'id',
  'weapon_id',
  'attachment_type',
  'name',
  'unlock_level',
  'is_active',
] as const

const mapColumns = [
  'id',
  'map_key',
  'name',
  'max_players',
  'supported_modes',
  'size_category',
  'is_active',
] as const

export const StaticDataRepositoryLive = Layer.effect(
  StaticDataRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService
    const redis = yield* RedisService
    const gameConfig = yield* GameConfig

    const getActiveWeapons: StaticDataRepositoryType['getActiveWeapons'] = () =>
      Effect.gen(function* () {
        const cached = yield* Effect.option(
          redis.get(CACHE_KEYS.weapons).pipe(Effect.orDie)
        )
        if (cached._tag === 'Some' && cached.value) {
          return JSON.parse(cached.value)
        }

        const rows = yield* Effect.promise(async () => {
          return db
            .selectFrom('weapons')
            .where('is_active', '=', true)
            .orderBy('unlock_level', 'asc')
            .orderBy('name', 'asc')
            .select(weaponColumns)
            .execute()
        }).pipe(Effect.orDie)

        const weapons = rows.map((row) => mapWeaponRowToEntity(row as unknown as WeaponRow))
        
        yield* redis
          .set(CACHE_KEYS.weapons, JSON.stringify(weapons), gameConfig.staticDataCacheTtlSeconds)
          .pipe(Effect.orDie)

        return weapons
      })

    const getWeaponByKey: StaticDataRepositoryType['getWeaponByKey'] = (weaponKey) =>
      Effect.gen(function* () {
        const cacheKey = CACHE_KEYS.weapon(weaponKey)
        const cached = yield* Effect.option(
          redis.get(cacheKey).pipe(Effect.orDie)
        )
        if (cached._tag === 'Some' && cached.value) {
          return JSON.parse(cached.value)
        }

        const row = yield* Effect.promise(async () => {
          return db
            .selectFrom('weapons')
            .where('weapon_key', '=', weaponKey)
            .where('is_active', '=', true)
            .select(weaponColumns)
            .executeTakeFirst()
        }).pipe(Effect.orDie)

        if (!row) return null

        const weapon = mapWeaponRowToEntity(row as unknown as WeaponRow)
        yield* redis
          .set(cacheKey, JSON.stringify(weapon), gameConfig.staticDataCacheTtlSeconds)
          .pipe(Effect.orDie)

        return weapon
      })

    const getWeaponAttachments: StaticDataRepositoryType['getWeaponAttachments'] = (weaponId) =>
      Effect.gen(function* () {
        const cacheKey = CACHE_KEYS.attachments(weaponId)
        const cached = yield* Effect.option(
          redis.get(cacheKey).pipe(Effect.orDie)
        )
        if (cached._tag === 'Some' && cached.value) {
          return JSON.parse(cached.value)
        }

        const rows = yield* Effect.promise(async () => {
          return db
            .selectFrom('weapon_attachments')
            .where('weapon_id', '=', weaponId)
            .where('is_active', '=', true)
            .orderBy('unlock_level', 'asc')
            .orderBy('name', 'asc')
            .select(weaponAttachmentColumns)
            .execute()
        }).pipe(Effect.orDie)

        const attachments = rows.map((row) =>
          mapWeaponAttachmentRowToEntity(row as unknown as WeaponAttachmentRow)
        )
        
        yield* redis
          .set(cacheKey, JSON.stringify(attachments), gameConfig.staticDataCacheTtlSeconds)
          .pipe(Effect.orDie)

        return attachments
      })

    const getActiveMaps: StaticDataRepositoryType['getActiveMaps'] = () =>
      Effect.gen(function* () {
        const cached = yield* Effect.option(
          redis.get(CACHE_KEYS.maps).pipe(Effect.orDie)
        )
        if (cached._tag === 'Some' && cached.value) {
          return JSON.parse(cached.value)
        }

        const rows = yield* Effect.promise(async () => {
          return db
            .selectFrom('maps')
            .where('is_active', '=', true)
            .orderBy('name', 'asc')
            .select(mapColumns)
            .execute()
        }).pipe(Effect.orDie)

        const maps = rows.map((row) => mapMapRowToEntity(row as unknown as MapRow))
        
        yield* redis
          .set(CACHE_KEYS.maps, JSON.stringify(maps), gameConfig.staticDataCacheTtlSeconds)
          .pipe(Effect.orDie)

        return maps
      })

    return StaticDataRepository.of({
      getActiveWeapons,
      getWeaponByKey,
      getWeaponAttachments,
      getActiveMaps,
    })
  })
)
