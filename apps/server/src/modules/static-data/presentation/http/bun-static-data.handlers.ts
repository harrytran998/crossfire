import { Effect, ParseResult, Schema } from 'effect'
import { StaticDataService } from '../../application/services/static-data.service'
import type { RouteDefinition } from '../../../../http/radix-router'
import { HTTP_STATUS } from '../../../../http/status'

const WeaponKeyParamSchema = Schema.Struct({
  weaponKey: Schema.String.pipe(Schema.pattern(/^[a-z0-9_-]{1,64}$/i)),
})

const validationErrorResponse = (error: ParseResult.ParseError): Response =>
  Response.json(
    {
      error: 'Invalid request params',
      details: ParseResult.ArrayFormatter.formatErrorSync(error),
    },
    { status: HTTP_STATUS.BAD_REQUEST }
  )

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
  const decoded = Schema.decodeUnknownEither(WeaponKeyParamSchema)({
    weaponKey: params.weaponKey ?? '',
  })
  if (decoded._tag === 'Left') {
    return validationErrorResponse(decoded.left)
  }

  const { weaponKey } = decoded.right

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
