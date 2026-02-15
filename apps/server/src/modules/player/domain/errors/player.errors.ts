import { Data, Schema } from 'effect'
import { HttpServerRespondable, HttpServerResponse } from '@effect/platform'

export class PlayerNotFoundError extends Data.TaggedError('PlayerNotFoundError')<{
  readonly playerId?: string
}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: 'Player not found' }, { status: 404 })
  }
}

export class PlayerAlreadyExistsError extends Data.TaggedError('PlayerAlreadyExistsError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: 'Player profile already exists' }, { status: 409 })
  }
}

export class UpdatePlayerSchema extends Schema.Class<UpdatePlayerSchema>('UpdatePlayerSchema')({
  displayName: Schema.optional(Schema.String.pipe(Schema.minLength(3), Schema.maxLength(64))),
  avatarUrl: Schema.optional(Schema.String.pipe(Schema.maxLength(512))),
  bio: Schema.optional(Schema.String.pipe(Schema.maxLength(500))),
  region: Schema.optional(Schema.String),
  language: Schema.optional(Schema.String),
}) {}

export class CreatePlayerSchema extends Schema.Class<CreatePlayerSchema>('CreatePlayerSchema')({
  displayName: Schema.String.pipe(Schema.minLength(3), Schema.maxLength(64)),
  region: Schema.optional(Schema.String),
  language: Schema.optional(Schema.String),
}) {}
