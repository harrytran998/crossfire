import { Effect, ParseResult, Schema } from 'effect'
import { AuthService } from '../../../auth/application/services/auth.service'
import { FriendsService } from '../../application/services/friends.service'
import {
  FriendPlayerIdParamSchema,
  FriendshipIdParamSchema,
  SendFriendRequestSchema,
} from '../../domain/errors/friends.errors'
import { errorResponse } from '../../../../http/response'
import { extractBearerToken, parseJsonObject } from '../../../../http/request'
import type { RouteDefinition } from '../../../../http/radix-router'
import { HTTP_STATUS } from '../../../../http/status'

const requireAuthUser = async (
  req: Request,
  runApp: <A, E, R>(effect: Effect.Effect<A, E, R>) => Promise<A>
): Promise<{ userId: string } | Response> => {
  const token = extractBearerToken(req)
  if (!token) {
    return errorResponse(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized')
  }

  const authSession = await runApp(
    Effect.gen(function* () {
      const auth = yield* AuthService
      return yield* auth.validateSession(token)
    })
  )

  return { userId: authSession.user.id }
}

const validationErrorResponse = (error: ParseResult.ParseError, source: string): Response =>
  Response.json(
    {
      error: `Invalid ${source}`,
      details: ParseResult.ArrayFormatter.formatErrorSync(error),
    },
    { status: HTTP_STATUS.BAD_REQUEST }
  )

const sendRequestHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const parsed = await parseJsonObject(req)
  if (!parsed.ok) return parsed.response

  const decoded = Schema.decodeUnknownEither(SendFriendRequestSchema)(parsed.body)
  if (decoded._tag === 'Left') {
    return validationErrorResponse(decoded.left, 'request body')
  }

  const payload = await runApp(
    Effect.gen(function* () {
      const friendsService = yield* FriendsService
      return yield* friendsService.sendRequest(auth.userId, decoded.right.playerId)
    })
  )

  return Response.json(payload, { status: HTTP_STATUS.CREATED })
}

const listRequestsHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const requests = await runApp(
    Effect.gen(function* () {
      const friendsService = yield* FriendsService
      return yield* friendsService.listRequests(auth.userId)
    })
  )

  return Response.json(requests)
}

const acceptRequestHandler: RouteDefinition['handler'] = async (req, { params, runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const decodedParam = Schema.decodeUnknownEither(FriendshipIdParamSchema)({
    friendshipId: params.friendshipId ?? '',
  })
  if (decodedParam._tag === 'Left') {
    return validationErrorResponse(decodedParam.left, 'route params')
  }

  await runApp(
    Effect.gen(function* () {
      const friendsService = yield* FriendsService
      yield* friendsService.acceptRequest(auth.userId, decodedParam.right.friendshipId)
    })
  )

  return new Response(null, { status: HTTP_STATUS.NO_CONTENT })
}

const declineRequestHandler: RouteDefinition['handler'] = async (req, { params, runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const decodedParam = Schema.decodeUnknownEither(FriendshipIdParamSchema)({
    friendshipId: params.friendshipId ?? '',
  })
  if (decodedParam._tag === 'Left') {
    return validationErrorResponse(decodedParam.left, 'route params')
  }

  await runApp(
    Effect.gen(function* () {
      const friendsService = yield* FriendsService
      yield* friendsService.declineRequest(auth.userId, decodedParam.right.friendshipId)
    })
  )

  return new Response(null, { status: HTTP_STATUS.NO_CONTENT })
}

const listFriendsHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const friends = await runApp(
    Effect.gen(function* () {
      const friendsService = yield* FriendsService
      return yield* friendsService.listFriends(auth.userId)
    })
  )

  return Response.json({ friends })
}

const removeFriendHandler: RouteDefinition['handler'] = async (req, { params, runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const decodedParam = Schema.decodeUnknownEither(FriendPlayerIdParamSchema)({
    friendPlayerId: params.friendPlayerId ?? '',
  })
  if (decodedParam._tag === 'Left') {
    return validationErrorResponse(decodedParam.left, 'route params')
  }

  await runApp(
    Effect.gen(function* () {
      const friendsService = yield* FriendsService
      yield* friendsService.removeFriend(auth.userId, decodedParam.right.friendPlayerId)
    })
  )

  return new Response(null, { status: HTTP_STATUS.NO_CONTENT })
}

export const friendsRoutes: readonly RouteDefinition[] = [
  { method: 'POST', path: '/api/friends/requests', handler: sendRequestHandler },
  { method: 'GET', path: '/api/friends/requests', handler: listRequestsHandler },
  {
    method: 'POST',
    path: '/api/friends/requests/:friendshipId/accept',
    handler: acceptRequestHandler,
  },
  {
    method: 'POST',
    path: '/api/friends/requests/:friendshipId/decline',
    handler: declineRequestHandler,
  },
  { method: 'GET', path: '/api/friends', handler: listFriendsHandler },
  { method: 'DELETE', path: '/api/friends/:friendPlayerId', handler: removeFriendHandler },
]
