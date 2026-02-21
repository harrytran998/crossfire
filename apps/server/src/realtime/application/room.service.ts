import { Context, Data, Effect, Layer, Option } from 'effect'
import { RoomRepository } from '../domain/room.repository'
import { 
  Room, 
  RoomError, 
  CreateRoomOptions, 
  RoomPlayer, 
  RoomStatus,
  RoomErrorCode 
} from '../domain/room'
import * as UUID from 'uuid'

export interface RoomService {
  readonly createRoom: (options: CreateRoomOptions) => Effect.Effect<Room, RoomError>
  readonly joinRoom: (roomId: string, playerId: string, username: string) => Effect.Effect<Room, RoomError>
  readonly leaveRoom: (roomId: string, playerId: string) => Effect.Effect<Room, RoomError>
  readonly readyUp: (roomId: string, playerId: string, ready: boolean) => Effect.Effect<Room, RoomError>
  readonly startGame: (roomId: string, hostId: string) => Effect.Effect<Room, RoomError>
  readonly kickPlayer: (roomId: string, hostId: string, playerId: string) => Effect.Effect<Room, RoomError>
  readonly getRoom: (roomId: string) => Effect.Effect<Option<Room>, never>
  readonly getPlayerRoom: (playerId: string) => Effect.Effect<Option<Room>, never>
  readonly listPublicRooms: () => Effect.Effect<Room[], never>
}

export const RoomService = Context.Tag<RoomService>()

export const RoomServiceLive = Layer.effect(
  RoomService,
  Effect.gen(function* () {
    const repository = yield* RoomRepository

    const fail = (reason: string, code: RoomErrorCode) => Effect.fail(new RoomError(reason, code))

    const validatePlayerNotInRoom = (playerId: string) => Effect.gen(function* () {
      const existing = yield* repository.findByPlayerId(playerId)
      if (Option.isSome(existing)) {
        return yield* fail('Player already in a room', 'ALREADY_IN_ROOM')
      }
    })

    const validateRoomExists = (roomId: string) => Effect.gen(function* () {
      const roomOpt = yield* repository.findById(roomId)
      if (Option.isNone(roomOpt)) {
        return yield* fail('Room not found', 'ROOM_NOT_FOUND')
      }
      return roomOpt.value
    })

    const validateIsHost = (room: Room, playerId: string) => Effect.gen(function* () {
      if (room.hostId !== playerId) {
        return yield* fail('Only host can perform this action', 'NOT_HOST')
      }
    })

    return {
      createRoom: (options: CreateRoomOptions) =>
        Effect.gen(function* () {
          yield* validatePlayerNotInRoom(options.hostId)

          const now = Date.now()
          const room: Room = {
            id: UUID.v4(),
            name: options.name,
            hostId: options.hostId,
            status: 'waiting',
            maxPlayers: options.maxPlayers,
            gameMode: options.gameMode,
            mapId: options.mapId,
            isPublic: options.isPublic,
            players: [{
              playerId: options.hostId,
              username: options.hostUsername,
              isReady: false,
              isHost: true,
              joinedAt: now
            }],
            createdAt: now,
            updatedAt: now
          }

          return yield* repository.create(room)
        }),

      joinRoom: (roomId: string, playerId: string, username: string) =>
        Effect.gen(function* () {
          yield* validatePlayerNotInRoom(playerId)
          const room = yield* validateRoomExists(roomId)

          if (room.status === 'playing' || room.status === 'closed') {
            return yield* fail('Room is not accepting new players', 'INVALID_STATUS')
          }

          if (room.players.length >= room.maxPlayers) {
            return yield* fail('Room is full', 'ROOM_FULL')
          }

          const newPlayer: RoomPlayer = {
            playerId,
            username,
            isReady: false,
            isHost: false,
            joinedAt: Date.now()
          }

          const updated: Room = {
            ...room,
            players: [...room.players, newPlayer],
            updatedAt: Date.now()
          }

          return yield* repository.update(updated)
        }),

      leaveRoom: (roomId: string, playerId: string) =>
        Effect.gen(function* () {
          const room = yield* validateRoomExists(roomId)

          const playerIndex = room.players.findIndex(p => p.playerId === playerId)
          if (playerIndex === -1) {
            return yield* fail('Player not in room', 'NOT_IN_ROOM')
          }

          const isHost = room.players[playerIndex].isHost
          const remainingPlayers = room.players.filter(p => p.playerId !== playerId)

          if (remainingPlayers.length === 0) {
            yield* repository.delete(roomId)
            return { ...room, status: 'closed', players: [] }
          }

          const updated: Room = {
            ...room,
            players: remainingPlayers,
            hostId: isHost ? remainingPlayers[0].playerId : room.hostId,
            updatedAt: Date.now()
          }

          if (isHost) {
            updated.players[0].isHost = true
          }

          return yield* repository.update(updated)
        }),

      readyUp: (roomId: string, playerId: string, ready: boolean) =>
        Effect.gen(function* () {
          const room = yield* validateRoomExists(roomId)

          const player = room.players.find(p => p.playerId === playerId)
          if (!player) {
            return yield* fail('Player not in room', 'NOT_IN_ROOM')
          }

          const updatedPlayers = room.players.map(p =>
            p.playerId === playerId ? { ...p, isReady: ready } : p
          )

          const allReady = updatedPlayers.every(p => p.isReady || p.isHost)

          const updated: Room = {
            ...room,
            players: updatedPlayers,
            status: allReady && updatedPlayers.length >= 2 ? 'ready' : 'waiting',
            updatedAt: Date.now()
          }

          return yield* repository.update(updated)
        }),

      startGame: (roomId: string, hostId: string) =>
        Effect.gen(function* () {
          const room = yield* validateRoomExists(roomId)
          yield* validateIsHost(room, hostId)

          if (room.status !== 'ready') {
            return yield* fail('Not all players are ready', 'INVALID_STATUS')
          }

          const updated: Room = {
            ...room,
            status: 'playing',
            updatedAt: Date.now()
          }

          return yield* repository.update(updated)
        }),

      kickPlayer: (roomId: string, hostId: string, playerId: string) =>
        Effect.gen(function* () {
          const room = yield* validateRoomExists(roomId)
          yield* validateIsHost(room, hostId)

          if (playerId === hostId) {
            return yield* fail('Cannot kick yourself', 'CANNOT_KICK_HOST')
          }

          const playerIndex = room.players.findIndex(p => p.playerId === playerId)
          if (playerIndex === -1) {
            return yield* fail('Player not found', 'PLAYER_NOT_FOUND')
          }

          const updated: Room = {
            ...room,
            players: room.players.filter(p => p.playerId !== playerId),
            updatedAt: Date.now()
          }

          return yield* repository.update(updated)
        }),

      getRoom: (roomId: string) => repository.findById(roomId),

      getPlayerRoom: (playerId: string) => repository.findByPlayerId(playerId),

      listPublicRooms: () => repository.listPublic(50)
    }
  })
)
