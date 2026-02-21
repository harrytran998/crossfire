import { Context, Effect, Layer, Option } from 'effect'
import { RoomService } from '../application/room.service'
import { WebSocketGateway } from '../gateway/websocket.gateway'
import { ConnectionManager } from '../gateway/connection.manager'
import { 
  MessageType, 
  createEnvelope,
  createError,
  type MessageEnvelope,
  type RoomCreatePayload,
  type RoomJoinPayload,
  type RoomLeavePayload,
  type RoomReadyPayload,
  type RoomKickPayload
} from '../protocol/message.types'

export interface HandlerContext {
  readonly connectionId: string
  readonly playerId: string
}

export type MessageHandler = (
  ctx: HandlerContext,
  payload: unknown
) => Effect.Effect<void, never>

export interface RoomHandlers {
  readonly handleCreate: MessageHandler
  readonly handleJoin: MessageHandler
  readonly handleLeave: MessageHandler
  readonly handleReady: MessageHandler
  readonly handleStart: MessageHandler
  readonly handleKick: MessageHandler
  readonly handleList: MessageHandler
}

export const RoomHandlers = Context.Tag<RoomHandlers>()

export const RoomHandlersLive = Layer.effect(
  RoomHandlers,
  Effect.gen(function* () {
    const roomService = yield* RoomService
    const wsGateway = yield* WebSocketGateway
    const connectionManager = yield* ConnectionManager

    const broadcastToRoom = (roomId: string, message: MessageEnvelope) =>
      Effect.gen(function* () {
        const roomOpt = yield* roomService.getRoom(roomId)
        if (Option.isNone(roomOpt)) return
        
        const room = roomOpt.value
        for (const player of room.players) {
          yield* wsGateway.sendToPlayer(player.playerId, message)
        }
      })

    return {
      handleCreate: (ctx: HandlerContext, payload: unknown) =>
        Effect.gen(function* () {
          const options = payload as RoomCreatePayload
          const room = yield* roomService.createRoom({
            ...options,
            hostId: ctx.playerId,
            hostUsername: 'Player' // TODO: Get from player service
          })

          yield* wsGateway.sendToPlayer(ctx.playerId, createEnvelope(
            MessageType.ROOM_CREATED,
            { roomId: room.id, name: room.name },
            0
          ))

          yield* Effect.log(`Room created: ${room.id} by ${ctx.playerId}`)
        }).pipe(
          Effect.catchAll((error) =>
            wsGateway.sendToPlayer(ctx.playerId, createError(
              'ROOM_CREATE_FAILED',
              error instanceof Error ? error.message : 'Failed to create room'
            ))
          )
        ),

      handleJoin: (ctx: HandlerContext, payload: unknown) =>
        Effect.gen(function* () {
          const { roomId } = payload as RoomJoinPayload
          const room = yield* roomService.joinRoom(roomId, ctx.playerId, 'Player')

          yield* wsGateway.sendToPlayer(ctx.playerId, createEnvelope(
            MessageType.ROOM_JOINED,
            { roomId: room.id, playerCount: room.players.length },
            0
          ))

          yield* broadcastToRoom(roomId, createEnvelope(
            MessageType.ROOM_UPDATE,
            { room },
            0
          ))

          yield* Effect.log(`Player ${ctx.playerId} joined room ${roomId}`)
        }).pipe(
          Effect.catchAll((error) =>
            wsGateway.sendToPlayer(ctx.playerId, createError(
              'ROOM_JOIN_FAILED',
              error instanceof Error ? error.message : 'Failed to join room'
            ))
          )
        ),

      handleLeave: (ctx: HandlerContext, payload: unknown) =>
        Effect.gen(function* () {
          const { roomId } = payload as RoomLeavePayload
          const room = yield* roomService.leaveRoom(roomId, ctx.playerId)

          yield* wsGateway.sendToPlayer(ctx.playerId, createEnvelope(
            MessageType.ROOM_LEFT,
            { roomId },
            0
          ))

          if (room.players.length > 0) {
            yield* broadcastToRoom(roomId, createEnvelope(
              MessageType.ROOM_UPDATE,
              { room },
              0
            ))
          }

          yield* Effect.log(`Player ${ctx.playerId} left room ${roomId}`)
        }).pipe(
          Effect.catchAll((error) =>
            wsGateway.sendToPlayer(ctx.playerId, createError(
              'ROOM_LEAVE_FAILED',
              error instanceof Error ? error.message : 'Failed to leave room'
            ))
          )
        ),

      handleReady: (ctx: HandlerContext, payload: unknown) =>
        Effect.gen(function* () {
          const { roomId, ready } = payload as RoomReadyPayload
          const room = yield* roomService.readyUp(roomId, ctx.playerId, ready)

          yield* broadcastToRoom(roomId, createEnvelope(
            MessageType.ROOM_UPDATE,
            { room },
            0
          ))

          yield* Effect.log(`Player ${ctx.playerId} ready status: ${ready} in room ${roomId}`)
        }).pipe(
          Effect.catchAll((error) =>
            wsGateway.sendToPlayer(ctx.playerId, createError(
              'ROOM_READY_FAILED',
              error instanceof Error ? error.message : 'Failed to update ready status'
            ))
          )
        ),

      handleStart: (ctx: HandlerContext, payload: unknown) =>
        Effect.gen(function* () {
          const { roomId } = payload as RoomLeavePayload
          const room = yield* roomService.startGame(roomId, ctx.playerId)

          yield* broadcastToRoom(roomId, createEnvelope(
            MessageType.ROOM_START,
            { roomId, status: room.status },
            0
          ))

          yield* Effect.log(`Game started in room ${roomId} by ${ctx.playerId}`)
        }).pipe(
          Effect.catchAll((error) =>
            wsGateway.sendToPlayer(ctx.playerId, createError(
              'ROOM_START_FAILED',
              error instanceof Error ? error.message : 'Failed to start game'
            ))
          )
        ),

      handleKick: (ctx: HandlerContext, payload: unknown) =>
        Effect.gen(function* () {
          const { roomId, playerId: targetPlayerId } = payload as RoomKickPayload
          const room = yield* roomService.kickPlayer(roomId, ctx.playerId, targetPlayerId)

          yield* wsGateway.sendToPlayer(targetPlayerId, createEnvelope(
            MessageType.ROOM_LEFT,
            { roomId, reason: 'kicked' },
            0
          ))

          yield* broadcastToRoom(roomId, createEnvelope(
            MessageType.ROOM_UPDATE,
            { room },
            0
          ))

          yield* Effect.log(`Player ${targetPlayerId} kicked from room ${roomId} by ${ctx.playerId}`)
        }).pipe(
          Effect.catchAll((error) =>
            wsGateway.sendToPlayer(ctx.playerId, createError(
              'ROOM_KICK_FAILED',
              error instanceof Error ? error.message : 'Failed to kick player'
            ))
          )
        ),

      handleList: (ctx: HandlerContext, _payload: unknown) =>
        Effect.gen(function* () {
          const rooms = yield* roomService.listPublicRooms()

          yield* wsGateway.sendToPlayer(ctx.playerId, createEnvelope(
            MessageType.ROOM_LIST_RESPONSE,
            { rooms },
            0
          ))
        }).pipe(
          Effect.catchAll((error) =>
            wsGateway.sendToPlayer(ctx.playerId, createError(
              'ROOM_LIST_FAILED',
              error instanceof Error ? error.message : 'Failed to list rooms'
            ))
          )
        )
    }
  })
)
