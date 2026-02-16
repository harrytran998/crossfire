import { Data, Schema } from 'effect'
import { HttpServerRespondable, HttpServerResponse } from '@effect/platform'
import { HTTP_STATUS } from '../../../../http/status'

const UuidSchema = Schema.String.pipe(
  Schema.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
)

export class FriendSelfRequestError extends Data.TaggedError('FriendSelfRequestError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json(
      { error: 'Cannot send friend request to yourself' },
      { status: HTTP_STATUS.BAD_REQUEST }
    )
  }
}

export class FriendRequestConflictError extends Data.TaggedError('FriendRequestConflictError')<{
  readonly reason: string
}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: this.reason }, { status: HTTP_STATUS.CONFLICT })
  }
}

export class FriendRequestNotFoundError extends Data.TaggedError('FriendRequestNotFoundError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json(
      { error: 'Friend request not found' },
      { status: HTTP_STATUS.NOT_FOUND }
    )
  }
}

export class FriendRelationNotFoundError extends Data.TaggedError('FriendRelationNotFoundError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: 'Friend not found' }, { status: HTTP_STATUS.NOT_FOUND })
  }
}

export class SendFriendRequestSchema extends Schema.Class<SendFriendRequestSchema>(
  'SendFriendRequestSchema'
)({
  playerId: UuidSchema,
}) {}

export class FriendshipIdParamSchema extends Schema.Class<FriendshipIdParamSchema>('FriendshipIdParamSchema')({
  friendshipId: UuidSchema,
}) {}

export class FriendPlayerIdParamSchema extends Schema.Class<FriendPlayerIdParamSchema>('FriendPlayerIdParamSchema')({
  friendPlayerId: UuidSchema,
}) {}
