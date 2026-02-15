import { Context, Effect, Layer } from 'effect'
import type { GameMap, Weapon, WeaponAttachment } from '../../domain/entities/static-data.entity'
import {
  StaticDataRepository as StaticDataRepositoryTag,
  StaticDataRepositoryLive,
} from '../../infrastructure/repositories/static-data.repository.impl'

export interface StaticDataService {
  readonly getWeapons: () => Effect.Effect<readonly Weapon[]>
  readonly getWeaponAttachmentsByKey: (
    weaponKey: string
  ) => Effect.Effect<readonly WeaponAttachment[]>
  readonly getMaps: () => Effect.Effect<readonly GameMap[]>
}

export const StaticDataService = Context.GenericTag<StaticDataService>('StaticDataService')

export const StaticDataServiceLive = Layer.effect(
  StaticDataService,
  Effect.gen(function* () {
    const repo = yield* StaticDataRepositoryTag

    const getWeapons = () => repo.getActiveWeapons()

    const getWeaponAttachmentsByKey = (weaponKey: string) =>
      Effect.gen(function* () {
        const weapon = yield* repo.getWeaponByKey(weaponKey)
        if (!weapon) {
          return []
        }
        return yield* repo.getWeaponAttachments(weapon.id)
      })

    const getMaps = () => repo.getActiveMaps()

    return StaticDataService.of({
      getWeapons,
      getWeaponAttachmentsByKey,
      getMaps,
    })
  })
).pipe(Layer.provide(StaticDataRepositoryLive))
