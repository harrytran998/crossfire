import { Data, Schema } from 'effect'
import { HttpServerRespondable, HttpServerResponse } from '@effect/platform'
import { HTTP_STATUS } from '../../../../http/status'

const UuidSchema = Schema.String.pipe(
  Schema.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
)

export class MatchNotFoundError extends Data.TaggedError('MatchNotFoundError')<{
  readonly matchId?: string
}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: 'Match not found' }, { status: HTTP_STATUS.NOT_FOUND })
  }
}

export class MatchIdParamSchema extends Schema.Class<MatchIdParamSchema>('MatchIdParamSchema')({
  matchId: UuidSchema,
}) {}

export class MatchListQuerySchema extends Schema.Class<MatchListQuerySchema>(
  'MatchListQuerySchema'
)({
  page: Schema.optional(Schema.NumberFromString.pipe(Schema.int(), Schema.greaterThanOrEqualTo(1))),
  pageSize: Schema.optional(Schema.NumberFromString.pipe(Schema.int(), Schema.between(1, 100))),
}) {}
