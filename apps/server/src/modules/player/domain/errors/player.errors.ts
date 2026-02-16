import { Data, Schema } from 'effect'
import { HttpServerRespondable, HttpServerResponse } from '@effect/platform'
import { HTTP_STATUS } from '../../../../http/status'

const RegionSchema = Schema.Literal('ASIA', 'EU', 'NA', 'SA', 'AF', 'OC', 'ME')
const LanguageSchema = Schema.String.pipe(Schema.pattern(/^[a-z]{2}(-[A-Z]{2})?$/))
const AvatarUrlSchema = Schema.String.pipe(Schema.maxLength(512), Schema.pattern(/^https?:\/\/.+$/))

export class PlayerNotFoundError extends Data.TaggedError('PlayerNotFoundError')<{
  readonly playerId?: string
}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: 'Player not found' }, { status: HTTP_STATUS.NOT_FOUND })
  }
}

export class PlayerAlreadyExistsError extends Data.TaggedError('PlayerAlreadyExistsError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json(
      { error: 'Player profile already exists' },
      { status: HTTP_STATUS.CONFLICT }
    )
  }
}

export class UpdatePlayerSchema extends Schema.Class<UpdatePlayerSchema>('UpdatePlayerSchema')({
  displayName: Schema.optional(Schema.String.pipe(Schema.minLength(3), Schema.maxLength(64))),
  avatarUrl: Schema.optional(AvatarUrlSchema),
  bio: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(500))),
  region: Schema.optional(RegionSchema),
  language: Schema.optional(LanguageSchema),
}) {}

export class CreatePlayerSchema extends Schema.Class<CreatePlayerSchema>('CreatePlayerSchema')({
  displayName: Schema.String.pipe(Schema.minLength(3), Schema.maxLength(64)),
  region: Schema.optional(RegionSchema),
  language: Schema.optional(LanguageSchema),
}) {}
