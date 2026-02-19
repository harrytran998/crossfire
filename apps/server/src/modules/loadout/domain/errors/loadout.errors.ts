import { Data, Schema } from 'effect'
import { HttpServerRespondable, HttpServerResponse } from '@effect/platform'
import { HTTP_STATUS } from '../../../../http/status'

const UuidSchema = Schema.String.pipe(
  Schema.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
)

const LoadoutSlotSchema = Schema.Int.pipe(Schema.between(1, 10))

const AttachmentIdsSchema = Schema.Array(UuidSchema).pipe(Schema.maxItems(8))

export class LoadoutNotFoundError extends Data.TaggedError('LoadoutNotFoundError')<{
  readonly loadoutId?: string
}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json(
      { error: 'Loadout not found' },
      { status: HTTP_STATUS.NOT_FOUND }
    )
  }
}

export class LoadoutSlotTakenError extends Data.TaggedError('LoadoutSlotTakenError')<{
  readonly slot: number
}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json(
      { error: `Loadout slot ${this.slot} is already in use` },
      { status: HTTP_STATUS.CONFLICT }
    )
  }
}

export class LoadoutItemOwnershipError extends Data.TaggedError('LoadoutItemOwnershipError')<{
  readonly inventoryId: string
}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json(
      { error: 'Selected inventory item does not belong to player' },
      { status: HTTP_STATUS.FORBIDDEN }
    )
  }
}

export class CreateLoadoutSchema extends Schema.Class<CreateLoadoutSchema>('CreateLoadoutSchema')({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(64)),
  slot: LoadoutSlotSchema,
  isDefault: Schema.optional(Schema.Boolean),
  primaryWeaponId: Schema.optional(Schema.NullOr(UuidSchema)),
  secondaryWeaponId: Schema.optional(Schema.NullOr(UuidSchema)),
  meleeWeaponId: Schema.optional(Schema.NullOr(UuidSchema)),
  fragGrenades: Schema.optional(Schema.Int.pipe(Schema.between(0, 5))),
  flashGrenades: Schema.optional(Schema.Int.pipe(Schema.between(0, 5))),
  smokeGrenades: Schema.optional(Schema.Int.pipe(Schema.between(0, 5))),
  primaryAttachments: Schema.optional(AttachmentIdsSchema),
  secondaryAttachments: Schema.optional(AttachmentIdsSchema),
}) {}

export class UpdateLoadoutSchema extends Schema.Class<UpdateLoadoutSchema>('UpdateLoadoutSchema')({
  name: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(64))),
  slot: Schema.optional(LoadoutSlotSchema),
  isDefault: Schema.optional(Schema.Boolean),
  primaryWeaponId: Schema.optional(Schema.NullOr(UuidSchema)),
  secondaryWeaponId: Schema.optional(Schema.NullOr(UuidSchema)),
  meleeWeaponId: Schema.optional(Schema.NullOr(UuidSchema)),
  fragGrenades: Schema.optional(Schema.Int.pipe(Schema.between(0, 5))),
  flashGrenades: Schema.optional(Schema.Int.pipe(Schema.between(0, 5))),
  smokeGrenades: Schema.optional(Schema.Int.pipe(Schema.between(0, 5))),
  primaryAttachments: Schema.optional(AttachmentIdsSchema),
  secondaryAttachments: Schema.optional(AttachmentIdsSchema),
}) {}

export class LoadoutIdParamSchema extends Schema.Class<LoadoutIdParamSchema>(
  'LoadoutIdParamSchema'
)({
  loadoutId: UuidSchema,
}) {}
