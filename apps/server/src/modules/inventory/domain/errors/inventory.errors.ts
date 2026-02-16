import { Data, Schema } from 'effect'
import { HttpServerRespondable, HttpServerResponse } from '@effect/platform'
import { HTTP_STATUS } from '../../../../http/status'

const UuidSchema = Schema.String.pipe(
  Schema.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
)

export class InventoryWeaponNotFoundError extends Data.TaggedError('InventoryWeaponNotFoundError')<{
  readonly weaponId: string
}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: 'Weapon not found' }, { status: HTTP_STATUS.NOT_FOUND })
  }
}

export class AcquireInventorySchema extends Schema.Class<AcquireInventorySchema>('AcquireInventorySchema')({
  weaponId: UuidSchema,
  isPermanent: Schema.optional(Schema.Boolean),
  expiresAt: Schema.optional(Schema.DateFromString),
}) {}
