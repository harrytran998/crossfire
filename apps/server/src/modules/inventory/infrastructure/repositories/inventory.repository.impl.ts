import { Context, Effect, Layer } from 'effect'
import { DatabaseService } from '../../../../services/database.service'
import type { InventoryRepository as InventoryRepositoryType } from '../../domain/repositories/inventory.repository'
import type {
  AcquireInventoryInput,
  InventoryJoinedRow,
} from '../../domain/entities/inventory.entity'
import { mapInventoryJoinedRowToEntity } from '../../domain/entities/inventory.entity'
import { InventoryWeaponNotFoundError } from '../../domain/errors/inventory.errors'

export const InventoryRepository =
  Context.GenericTag<InventoryRepositoryType>('InventoryRepository')

export const InventoryRepositoryLive = Layer.effect(
  InventoryRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService

    const assertActiveWeapon = (weaponId: string) =>
      Effect.promise(async () => {
        const weapon = await db
          .selectFrom('weapons')
          .select(['id'])
          .where('id', '=', weaponId)
          .where('is_active', '=', true)
          .executeTakeFirst()
        return Boolean(weapon)
      }).pipe(
        Effect.orDie,
        Effect.flatMap((found) =>
          found ? Effect.void : Effect.fail(new InventoryWeaponNotFoundError({ weaponId }))
        )
      )

    const listByPlayerId: InventoryRepositoryType['listByPlayerId'] = (playerId) =>
      Effect.promise(async () => {
        const rows = await db
          .selectFrom('player_inventory as pi')
          .innerJoin('weapons as w', 'w.id', 'pi.weapon_id')
          .select([
            'pi.id as id',
            'pi.player_id as player_id',
            'pi.weapon_id as weapon_id',
            'pi.acquired_at as acquired_at',
            'pi.is_permanent as is_permanent',
            'pi.expires_at as expires_at',
            'w.weapon_key as weapon_key',
            'w.name as weapon_name',
            'w.weapon_type as weapon_type',
            'w.rarity as weapon_rarity',
          ])
          .where('pi.player_id', '=', playerId)
          .orderBy('pi.acquired_at', 'desc')
          .execute()

        return rows.map((row) =>
          mapInventoryJoinedRowToEntity(row as unknown as InventoryJoinedRow)
        )
      }).pipe(Effect.orDie)

    const acquireWeapon: InventoryRepositoryType['acquireWeapon'] = (
      input: AcquireInventoryInput
    ) =>
      Effect.gen(function* () {
        yield* assertActiveWeapon(input.weaponId)

        yield* Effect.promise(async () => {
          await db
            .insertInto('player_inventory')
            .values({
              player_id: input.playerId,
              weapon_id: input.weaponId,
              is_permanent: input.isPermanent ?? true,
              expires_at: input.expiresAt ?? null,
            })
            .onConflict((oc) => oc.columns(['player_id', 'weapon_id']).doNothing())
            .executeTakeFirst()
        }).pipe(Effect.orDie)

        const joined = yield* Effect.promise(async () => {
          return db
            .selectFrom('player_inventory as pi')
            .innerJoin('weapons as w', 'w.id', 'pi.weapon_id')
            .select([
              'pi.id as id',
              'pi.player_id as player_id',
              'pi.weapon_id as weapon_id',
              'pi.acquired_at as acquired_at',
              'pi.is_permanent as is_permanent',
              'pi.expires_at as expires_at',
              'w.weapon_key as weapon_key',
              'w.name as weapon_name',
              'w.weapon_type as weapon_type',
              'w.rarity as weapon_rarity',
            ])
            .where('pi.player_id', '=', input.playerId)
            .where('pi.weapon_id', '=', input.weaponId)
            .executeTakeFirstOrThrow()
        }).pipe(Effect.orDie)

        return mapInventoryJoinedRowToEntity(joined as unknown as InventoryJoinedRow)
      })

    const hasInventoryItem: InventoryRepositoryType['hasInventoryItem'] = (playerId, inventoryId) =>
      Effect.promise(async () => {
        const found = await db
          .selectFrom('player_inventory')
          .select(['id'])
          .where('id', '=', inventoryId)
          .where('player_id', '=', playerId)
          .executeTakeFirst()
        return Boolean(found)
      }).pipe(Effect.orDie)

    return InventoryRepository.of({
      listByPlayerId,
      acquireWeapon,
      hasInventoryItem,
    })
  })
)
