import { Effect, Layer, Option } from 'effect'
import { RoomRepository } from '../domain/room.repository'
import { Room, RoomError, CreateRoomOptions, RoomPlayer, RoomStatus } from '../domain/room'
import { RedisService } from '../../../services/redis.service'
import * as Schema from '@effect/schema/Schema'
import * as UUID from 'uuid'

const ROOM_KEY = (id: string) => `room:${id}`
const PLAYER_ROOM_KEY = (playerId: string) => `room:player:${playerId}`
const PUBLIC_ROOMS_KEY = 'rooms:public'

export const RedisRoomRepositoryLive = Layer.effect(
  RoomRepository,
  Effect.gen(function* () {
    const redis = yield* RedisService

    const generateId = () => UUID.v4()

    const serialize = (room: Room): string => JSON.stringify(room)
    const deserialize = (data: string): Room => JSON.parse(data)

    return {
      create: (room: Room) =>
        Effect.gen(function* () {
          yield* redis.set(ROOM_KEY(room.id), serialize(room))
          yield* redis.set(PLAYER_ROOM_KEY(room.hostId), room.id)
          
          if (room.isPublic) {
            yield* redis.sadd(PUBLIC_ROOMS_KEY, room.id)
          }
          
          return room
        }),

      findById: (id: string) =>
        Effect.gen(function* () {
          const data = yield* redis.get(ROOM_KEY(id))
          if (!data) return Option.none()
          return Option.some(deserialize(data))
        }),

      findByPlayerId: (playerId: string) =>
        Effect.gen(function* () {
          const roomId = yield* redis.get(PLAYER_ROOM_KEY(playerId))
          if (!roomId) return Option.none()
          const data = yield* redis.get(ROOM_KEY(roomId))
          if (!data) return Option.none()
          return Option.some(deserialize(data))
        }),

      update: (room: Room) =>
        Effect.gen(function* () {
          const existing = yield* redis.get(ROOM_KEY(room.id))
          if (!existing) {
            return yield* Effect.fail(new RoomError('Room not found', 'ROOM_NOT_FOUND'))
          }
          
          yield* redis.set(ROOM_KEY(room.id), serialize({ ...room, updatedAt: Date.now() }))
          
          for (const player of room.players) {
            yield* redis.set(PLAYER_ROOM_KEY(player.playerId), room.id)
          }
          
          if (room.isPublic) {
            yield* redis.sadd(PUBLIC_ROOMS_KEY, room.id)
          } else {
            yield* redis.srem(PUBLIC_ROOMS_KEY, room.id)
          }
          
          return room
        }),

      delete: (id: string) =>
        Effect.gen(function* () {
          const data = yield* redis.get(ROOM_KEY(id))
          if (data) {
            const room = deserialize(data)
            for (const player of room.players) {
              yield* redis.del(PLAYER_ROOM_KEY(player.playerId))
            }
            yield* redis.srem(PUBLIC_ROOMS_KEY, id)
          }
          yield* redis.del(ROOM_KEY(id))
        }),

      listPublic: (limit = 50) =>
        Effect.gen(function* () {
          const ids = yield* redis.smembers(PUBLIC_ROOMS_KEY)
          const rooms: Room[] = []
          
          for (const id of ids.slice(0, limit)) {
            const data = yield* redis.get(ROOM_KEY(id))
            if (data) {
              const room = deserialize(data)
              if (room.status !== 'closed') {
                rooms.push(room)
              }
            }
          }
          
          return rooms
        })
    }
  })
)
