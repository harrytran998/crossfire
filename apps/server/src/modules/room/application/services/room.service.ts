import { Effect, Context, Layer } from 'effect'
import { RoomRepositoryImpl } from '../../infrastructure/repositories/room.repository.impl'
import type { Room, RoomPlayer, CreateRoomInput, RoomState, JoinRoomInput } from '../../domain/entities/room.entity'
import {
  RoomNotFoundError,
  RoomFullError,
  NotHostError,
  InvalidPasswordError,
  PlayerNotInRoomError,
  RoomAlreadyStartedError,
  GameAlreadyInProgressError,
  type RoomError,
} from '../../domain/errors/room.errors'

export interface RoomService {
  readonly createRoom: (input: CreateRoomInput) => Effect.Effect<Room, RoomError>
  readonly joinRoom: (input: JoinRoomInput) => Effect.Effect<Room, RoomError>
  readonly leaveRoom: (roomId: string, playerId: string) => Effect.Effect<Room, RoomError>
  readonly setReady: (roomId: string, playerId: string, ready: boolean) => Effect.Effect<Room, RoomError>
  readonly startGame: (roomId: string, playerId: string) => Effect.Effect<Room, RoomError>
  readonly kickPlayer: (roomId: string, hostId: string, playerId: string) => Effect.Effect<Room, RoomError>
  readonly getRoomState: (roomId: string) => Effect.Effect<RoomState | null, RoomError>
  readonly getActiveRooms: () => Effect.Effect<RoomState[], RoomError>
}

export class RoomServiceTag extends Context.Tag('RoomService')<
  RoomServiceTag,
  RoomService
>() {}

export const RoomServiceLive = Layer.effect(
  RoomServiceTag,
  Effect.gen(function* () {
    const repository = yield* RoomRepositoryImpl

    const createRoom = (input: CreateRoomInput): Effect.Effect<Room, RoomError> =>
      repository.create(input)

    const joinRoom = (input: JoinRoomInput): Effect.Effect<Room, RoomError> =>
      Effect.gen(function* () {
        const room = yield* repository.findById(input.roomId)
        if (!room) return yield* new RoomNotFoundError({ roomId: input.roomId })

        if (room.status !== 'waiting') {
          return yield* new RoomAlreadyStartedError({ roomId: input.roomId, status: room.status })
        }

        if (room.players.length >= room.maxPlayers) {
          return yield* new RoomFullError({ 
            roomId: input.roomId, 
            currentPlayers: room.players.length, 
            maxPlayers: room.maxPlayers 
          })
        }

        if (room.isPrivate && room.password !== input.password) {
          return yield* new InvalidPasswordError({ roomId: input.roomId })
        }

        const player: RoomPlayer = {
          id: input.playerId,
          ready: false,
          loadoutId: input.loadoutId,
          joinedAt: new Date(),
        }

        return yield* repository.addPlayer(input.roomId, player)
      })

    const leaveRoom = (roomId: string, playerId: string): Effect.Effect<Room, RoomError> =>
      Effect.gen(function* () {
        const room = yield* repository.findById(roomId)
        if (!room) return yield* new RoomNotFoundError({ roomId })

        if (!room.players.some((p: RoomPlayer) => p.id === playerId)) {
          return yield* new PlayerNotInRoomError({ roomId, playerId })
        }

        return yield* repository.removePlayer(roomId, playerId)
      })

    const setReady = (roomId: string, playerId: string, ready: boolean): Effect.Effect<Room, RoomError> =>
      Effect.gen(function* () {
        const room = yield* repository.findById(roomId)
        if (!room) return yield* new RoomNotFoundError({ roomId })

        if (!room.players.some((p: RoomPlayer) => p.id === playerId)) {
          return yield* new PlayerNotInRoomError({ roomId, playerId })
        }

        return yield* repository.updatePlayerReady(roomId, playerId, ready)
      })

    const startGame = (roomId: string, playerId: string): Effect.Effect<Room, RoomError> =>
      Effect.gen(function* () {
        const room = yield* repository.findById(roomId)
        if (!room) return yield* new RoomNotFoundError({ roomId })

        if (room.hostId !== playerId) {
          return yield* new NotHostError({ roomId, playerId })
        }

        if (room.status !== 'waiting') {
          return yield* new GameAlreadyInProgressError({ roomId })
        }

        const allReady = room.players.every((p: RoomPlayer) => p.ready)
        if (!allReady) {
          return yield* new PlayerNotInRoomError({ roomId, playerId: 'not-all-ready' })
        }

        return yield* repository.updateStatus(roomId, 'starting')
      })

    const kickPlayer = (roomId: string, hostId: string, playerId: string): Effect.Effect<Room, RoomError> =>
      Effect.gen(function* () {
        const room = yield* repository.findById(roomId)
        if (!room) return yield* new RoomNotFoundError({ roomId })

        if (room.hostId !== hostId) {
          return yield* new NotHostError({ roomId, playerId: hostId })
        }

        if (!room.players.some((p: RoomPlayer) => p.id === playerId)) {
          return yield* new PlayerNotInRoomError({ roomId, playerId })
        }

        return yield* repository.removePlayer(roomId, playerId)
      })

    const getRoomState = (roomId: string): Effect.Effect<RoomState | null, RoomError> =>
      Effect.gen(function* () {
        const room = yield* repository.findById(roomId)
        if (!room) return null

        return {
          roomId: room.id,
          name: room.name,
          hostId: room.hostId,
          mapId: room.mapId,
          status: room.status,
          players: room.players.map((p: RoomPlayer) => ({ id: p.id, ready: p.ready })),
          maxPlayers: room.maxPlayers,
          isPrivate: room.isPrivate,
        }
      })

    const getActiveRooms = (): Effect.Effect<RoomState[], RoomError> =>
      Effect.gen(function* () {
        const rooms = yield* repository.findActiveRooms()
        return rooms.map((room: Room) => ({
          roomId: room.id,
          name: room.name,
          hostId: room.hostId,
          mapId: room.mapId,
          status: room.status,
          players: room.players.map((p: RoomPlayer) => ({ id: p.id, ready: p.ready })),
          maxPlayers: room.maxPlayers,
          isPrivate: room.isPrivate,
        }))
      })

    return RoomServiceTag.of({
      createRoom,
      joinRoom,
      leaveRoom,
      setReady,
      startGame,
      kickPlayer,
      getRoomState,
      getActiveRooms,
    })
  })
)
