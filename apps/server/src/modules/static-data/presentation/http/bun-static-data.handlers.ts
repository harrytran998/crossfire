import { Effect } from 'effect'
import { StaticDataService } from '../../application/services/static-data.service'
import { errorResponse } from '../../../../http/response'
import type { RouteDefinition } from '../../../../http/radix-router'

const getWeaponsHandler: RouteDefinition['handler'] = async (_req, { runApp }) => {
  const weapons = await runApp(
    Effect.gen(function* () {
      const staticData = yield* StaticDataService
      return yield* staticData.getWeapons()
    })
  )

  return Response.json({ weapons })
}

const getWeaponAttachmentsHandler: RouteDefinition['handler'] = async (
  _req,
  { params, runApp }
) => {
  const weaponKey = params.weaponKey ?? ''
  if (!/^[a-z0-9_-]{1,64}$/i.test(weaponKey)) {
    return errorResponse(400, 'Invalid weapon key')
  }

  const attachments = await runApp(
    Effect.gen(function* () {
      const staticData = yield* StaticDataService
      return yield* staticData.getWeaponAttachmentsByKey(weaponKey)
    })
  )

  return Response.json({ attachments })
}

const getMapsHandler: RouteDefinition['handler'] = async (_req, { runApp }) => {
  const maps = await runApp(
    Effect.gen(function* () {
      const staticData = yield* StaticDataService
      return yield* staticData.getMaps()
    })
  )

  return Response.json({ maps })
}

export const staticDataRoutes: readonly RouteDefinition[] = [
  { method: 'GET', path: '/api/static/weapons', handler: getWeaponsHandler },
  {
    method: 'GET',
    path: '/api/static/weapons/:weaponKey/attachments',
    handler: getWeaponAttachmentsHandler,
  },
  { method: 'GET', path: '/api/static/maps', handler: getMapsHandler },
]
