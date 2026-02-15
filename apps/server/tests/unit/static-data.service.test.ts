import { describe, expect, test } from 'bun:test'
import { Effect, Layer } from 'effect'
import {
  StaticDataService,
  StaticDataServiceLive,
} from '../../src/modules/static-data/application/services/static-data.service'
import { ConfigLayer } from '../../src/layers/index'
import { DatabaseServiceLive } from '../../src/services/database.service'

describe('StaticDataService', () => {
  const BaseLayer = Layer.mergeAll(ConfigLayer, DatabaseServiceLive)
  const TestLayer = Layer.provide(StaticDataServiceLive, BaseLayer)

  const runTest = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Effect.runPromise(Effect.provide(effect, TestLayer) as Effect.Effect<A, E, never>)

  test('should return active maps from static data', async () => {
    const maps = await runTest(
      Effect.gen(function* () {
        const staticData = yield* StaticDataService
        return yield* staticData.getMaps()
      })
    )

    expect(maps.length).toBeGreaterThan(0)
    expect(maps.some((map) => map.key === 'desert_storm')).toBe(true)
  })

  test('should return weapons list and attachments by key', async () => {
    const payload = await runTest(
      Effect.gen(function* () {
        const staticData = yield* StaticDataService
        const weapons = yield* staticData.getWeapons()
        const weaponKey = weapons[0]?.key ?? 'ak47'
        const attachments = yield* staticData.getWeaponAttachmentsByKey(weaponKey)

        return { weapons, attachments }
      })
    )

    expect(Array.isArray(payload.weapons)).toBe(true)
    expect(Array.isArray(payload.attachments)).toBe(true)
  })
})
