import { describe, expect, test } from 'bun:test'
import { Effect, Layer } from 'effect'
import {
  AuthService,
  AuthServiceLive,
} from '../../src/modules/auth/application/services/auth.service'
import {
  InventoryService,
  InventoryServiceLive,
} from '../../src/modules/inventory/application/services/inventory.service'
import {
  LoadoutService,
  LoadoutServiceLive,
} from '../../src/modules/loadout/application/services/loadout.service'
import {
  PlayerService,
  PlayerServiceLive,
} from '../../src/modules/player/application/services/player.service'
import {
  StaticDataService,
  StaticDataServiceLive,
} from '../../src/modules/static-data/application/services/static-data.service'
import { ConfigLayer } from '../../src/layers'
import { DatabaseServiceLive } from '../../src/services/database.service'

describe('Inventory + Loadout services', () => {
  const BaseLayer = Layer.mergeAll(ConfigLayer, DatabaseServiceLive)
  const TestLayer = Layer.mergeAll(
    Layer.provide(AuthServiceLive, BaseLayer),
    Layer.provide(PlayerServiceLive, BaseLayer),
    Layer.provide(StaticDataServiceLive, BaseLayer),
    Layer.provide(InventoryServiceLive, BaseLayer),
    Layer.provide(LoadoutServiceLive, BaseLayer)
  )

  const runTest = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Effect.runPromise(Effect.provide(effect, TestLayer) as Effect.Effect<A, E, never>)

  test('should acquire inventory item and create loadout', async () => {
    const result = await runTest(
      Effect.gen(function* () {
        const auth = yield* AuthService
        const playerService = yield* PlayerService
        const staticData = yield* StaticDataService
        const inventoryService = yield* InventoryService
        const loadoutService = yield* LoadoutService

        const id = `${Date.now()}${Math.floor(Math.random() * 100000)}`
        const registered = yield* auth.register({
          email: `il-${id}@example.com`,
          username: `il_${id}`,
          password: 'TestPassword123!',
        })

        yield* playerService.createProfile({
          userId: registered.user.id,
          displayName: 'Inventory Tester',
          region: 'ASIA',
          language: 'en',
        })

        const weapons = yield* staticData.getWeapons()
        const weapon = weapons[0]
        if (!weapon) {
          throw new Error('No weapon data found')
        }

        const acquired = yield* inventoryService.acquireForUser(registered.user.id, {
          weaponId: weapon.id,
        })

        const loadout = yield* loadoutService.createForUser(registered.user.id, {
          name: 'Assault',
          slot: 1,
          primaryWeaponId: acquired.id,
        })

        const inventory = yield* inventoryService.listByUserId(registered.user.id)
        const loadouts = yield* loadoutService.listByUserId(registered.user.id)

        return { acquired, loadout, inventory, loadouts }
      })
    )

    expect(result.inventory.length).toBeGreaterThanOrEqual(1)
    expect(result.acquired.id).toBeTruthy()
    expect(result.loadout.slot).toBe(1)
    expect(result.loadouts.length).toBeGreaterThanOrEqual(1)
  })
})
