import { Data, Schema } from 'effect'
import { HttpServerRespondable, HttpServerResponse } from '@effect/platform'
import { HTTP_STATUS } from '../../../../http/status'

export class LeaderboardNotFoundError extends Data.TaggedError('LeaderboardNotFoundError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json(
      { error: 'Leaderboard not found' },
      { status: HTTP_STATUS.NOT_FOUND }
    )
  }
}

export class LeaderboardQuerySchema extends Schema.Class<LeaderboardQuerySchema>('LeaderboardQuerySchema')({
  metricKey: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(32))),
  period: Schema.optional(Schema.Literal('daily', 'weekly', 'monthly', 'all_time')),
  mode: Schema.optional(
    Schema.Literal(
      'team_deathmatch',
      'free_for_all',
      'search_destroy',
      'elimination',
      'mutation',
      'zombie'
    )
  ),
  page: Schema.optional(Schema.NumberFromString.pipe(Schema.int(), Schema.greaterThanOrEqualTo(1))),
  pageSize: Schema.optional(
    Schema.NumberFromString.pipe(Schema.int(), Schema.between(1, 100))
  ),
  includeCurrentPlayerRank: Schema.optional(
    Schema.transform(Schema.String, Schema.Boolean, {
      decode: (input) => input === 'true',
      encode: (input) => (input ? 'true' : 'false'),
    })
  ),
}) {}
