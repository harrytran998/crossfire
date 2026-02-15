import { Effect } from 'effect'
import { StaticDataService } from '../../application/services/static-data.service'

export const handleStaticDataRequest = async (
  req: Request,
  path: string,
  runApp: <A, E, R>(effect: Effect.Effect<A, E, R>) => Promise<A>
): Promise<Response | null> => {
  if (path === '/api/static/weapons' && req.method === 'GET') {
    const weapons = await runApp(
      Effect.gen(function* () {
        const staticData = yield* StaticDataService
        return yield* staticData.getWeapons()
      })
    )
    return Response.json({ weapons })
  }

  if (
    path.startsWith('/api/static/weapons/') &&
    path.endsWith('/attachments') &&
    req.method === 'GET'
  ) {
    const weaponKey = path.replace('/api/static/weapons/', '').replace('/attachments', '')
    if (weaponKey.length === 0) {
      return Response.json({ error: 'Weapon key is required' }, { status: 400 })
    }

    const attachments = await runApp(
      Effect.gen(function* () {
        const staticData = yield* StaticDataService
        return yield* staticData.getWeaponAttachmentsByKey(weaponKey)
      })
    )
    return Response.json({ attachments })
  }

  if (path === '/api/static/maps' && req.method === 'GET') {
    const maps = await runApp(
      Effect.gen(function* () {
        const staticData = yield* StaticDataService
        return yield* staticData.getMaps()
      })
    )
    return Response.json({ maps })
  }

  return null
}
