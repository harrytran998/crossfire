import { Effect, Context } from 'effect'
import type { RoomService } from '../../application/services/room.service'
import type { RoomError } from '../../domain/errors/room.errors'
import type { RoomState } from '../../domain/entities/room.entity'

export interface CreateRoomPayload {
  name: string
  configId: string
  mapId: string
  isPrivate?: boolean
  password?: string
}

export interface JoinRoomPayload {
  roomId: string
  password?: string
  loadoutId: string
}

export interface LeaveRoomPayload {
  roomId: string
}

export interface SetReadyPayload {
  roomId: string
  ready: boolean
}

export interface KickPlayerPayload {
  roomId: string
  playerId: string
}

export class RoomServiceContext extends Context.Tag('RoomServiceContext')<
  RoomServiceContext,
  RoomService
>() {}

export const createRoomHandler = (
  playerId: string,
  payload: CreateRoomPayload
): Effect.Effect<{ type: string; payload: RoomState }, RoomError, RoomServiceContext> =>
  Effect.gen(function* () {
    const service = yield* RoomServiceContext
    const room = yield* service.createRoom({
      name: payload.name,
      hostId: playerId,
      mapId: payload.mapId,
      configId: payload.configId,
      isPrivate: payload.isPrivate,
      password: payload.password,
    })

    const state = yield* service.getRoomState(room.id)
    return { type: 'room_state', payload: state! }
  })

export const joinRoomHandler = (
  playerId: string,
  payload: JoinRoomPayload
): Effect.Effect<{ type: string; payload: RoomState }, RoomError, RoomServiceContext> =>
  Effect.gen(function* () {
    const service = yield* RoomServiceContext
    yield* service.joinRoom({
      roomId: payload.roomId,
      playerId,
      loadoutId: payload.loadoutId,
      password: payload.password,
    })

    const state = yield* service.getRoomState(payload.roomId)
    return { type: 'room_state', payload: state! }
  })

export const leaveRoomHandler = (
  playerId: string,
  payload: LeaveRoomPayload
): Effect.Effect<
  { type: string; payload: { roomId: string; playerId: string } },
  RoomError,
  RoomServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* RoomServiceContext
    yield* service.leaveRoom(payload.roomId, playerId)

    return {
      type: 'player_left',
      payload: { roomId: payload.roomId, playerId },
    }
  })

export const setReadyHandler = (
  playerId: string,
  payload: SetReadyPayload
): Effect.Effect<
  { type: string; payload: { roomId: string; playerId: string; ready: boolean } },
  RoomError,
  RoomServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* RoomServiceContext
    yield* service.setReady(payload.roomId, playerId, payload.ready)

    return {
      type: 'player_ready',
      payload: {
        roomId: payload.roomId,
        playerId,
        ready: payload.ready,
      },
    }
  })

export const kickPlayerHandler = (
  hostId: string,
  payload: KickPlayerPayload
): Effect.Effect<
  { type: string; payload: { roomId: string; playerId: string } },
  RoomError,
  RoomServiceContext
> =>
  Effect.gen(function* () {
    const service = yield* RoomServiceContext
    yield* service.kickPlayer(payload.roomId, hostId, payload.playerId)

    return {
      type: 'player_left',
      payload: {
        roomId: payload.roomId,
        playerId: payload.playerId,
      },
    }
  })

export const roomHandlers = {
  create_room: createRoomHandler,
  join_room: joinRoomHandler,
  leave_room: leaveRoomHandler,
  set_ready: setReadyHandler,
  kick_player: kickPlayerHandler,
}
