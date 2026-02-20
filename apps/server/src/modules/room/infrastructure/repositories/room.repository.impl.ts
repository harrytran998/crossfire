import { Effect, Context, Layer } from 'effect'
import { GameConfig } from '@crossfire/shared'
import { RedisService } from '../../../../services/redis.service'
import { RedisError } from '../../../../errors'
import type { RoomRepository } from '../../domain/repositories/room.repository'
import type { Room, RoomPlayer, CreateRoomInput } from '../../domain/entities/room.entity'
import {
  RoomNotFoundError,
  PlayerAlreadyInRoomError,
  type RoomError,
} from '../../domain/errors/room.errors'

const ROOM_KEY_PREFIX = 'room:'
const ROOM_PLAYERS_PREFIX = 'room_players:'
const ACTIVE_ROOMS_KEY = 'rooms:active'

const mapRedisError = (_error: RedisError): RoomError =>
  new RoomNotFoundError({ roomId: 'unknown' })

const serializeRoom = (room: Room): string =>
  JSON.stringify({
    ...room,
    players: undefined,
    createdAt: room.createdAt.toISOString(),
  })

const deserializeRoom = (data: string, players: RoomPlayer[]): Room => {
  const parsed = JSON.parse(data)
  return {
    ...parsed,
    players,
    createdAt: new Date(parsed.createdAt),
  }
}

const serializePlayer = (player: RoomPlayer): string =>
  JSON.stringify({
    ...player,
    joinedAt: player.joinedAt.toISOString(),
  })

const deserializePlayer = (data: string): RoomPlayer => {
  const parsed = JSON.parse(data)
  return {
    ...parsed,
    joinedAt: new Date(parsed.joinedAt),
  }
}

export class RoomRepositoryImpl extends Context.Tag('RoomRepositoryImpl')<
  RoomRepositoryImpl,
  RoomRepository
>() {}

export const RoomRepositoryLive = Layer.effect(
  RoomRepositoryImpl,
  Effect.gen(function* () {
    const redis = yield* RedisService
    const gameConfig = yield* GameConfig

    const create = (input: CreateRoomInput): Effect.Effect<Room, RoomError> =>
      Effect.gen(function* () {
        const id = crypto.randomUUID()
        const now = new Date()
        const room: Room = {
          id,
          name: input.name,
          hostId: input.hostId,
          mapId: input.mapId,
          configId: input.configId,
          status: 'waiting',
          players: [],
          maxPlayers: input.maxPlayers ?? gameConfig.defaultMaxPlayersPerRoom,
          isPrivate: input.isPrivate ?? false,
          password: input.password ?? null,
          createdAt: now,
        }

        const roomKey = `${ROOM_KEY_PREFIX}${id}`
        yield* redis
          .set(roomKey, serializeRoom(room), gameConfig.roomTtlSeconds)
          .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))

        yield* Effect.tryPromise({
          try: () => redis.client.sadd(ACTIVE_ROOMS_KEY, id),
          catch: () => new RoomNotFoundError({ roomId: id }),
        })

        return room
      })

    const findById = (roomId: string): Effect.Effect<Room | null, RoomError> =>
      Effect.gen(function* () {
        const roomKey = `${ROOM_KEY_PREFIX}${roomId}`
        const roomData = yield* redis
          .get(roomKey)
          .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))

        if (!roomData) return null

        const playersKey = `${ROOM_PLAYERS_PREFIX}${roomId}`
        const playersData = yield* redis
          .hgetall(playersKey)
          .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))
        const players = Object.values(playersData).map(deserializePlayer)

        return deserializeRoom(roomData, players)
      })

    const addPlayer = (roomId: string, player: RoomPlayer): Effect.Effect<Room, RoomError> =>
      Effect.gen(function* () {
        const room = yield* findById(roomId)
        if (!room) return yield* new RoomNotFoundError({ roomId })

        if (room.players.some((p) => p.id === player.id)) {
          return yield* new PlayerAlreadyInRoomError({ roomId, playerId: player.id })
        }

        const playersKey = `${ROOM_PLAYERS_PREFIX}${roomId}`
        yield* redis
          .hset(playersKey, player.id, serializePlayer(player))
          .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))
        yield* redis
          .expire(playersKey, gameConfig.roomTtlSeconds)
          .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))

        const updatedRoom = yield* findById(roomId)
        if (!updatedRoom) return yield* new RoomNotFoundError({ roomId })
        return updatedRoom
      })

    const removePlayer = (roomId: string, playerId: string): Effect.Effect<Room, RoomError> =>
      Effect.gen(function* () {
        const room = yield* findById(roomId)
        if (!room) return yield* new RoomNotFoundError({ roomId })

        const playersKey = `${ROOM_PLAYERS_PREFIX}${roomId}`
        yield* Effect.tryPromise({
          try: () => redis.client.hdel(playersKey, playerId),
          catch: () => new RoomNotFoundError({ roomId }),
        })

        if (room.players.length <= 1) {
          yield* Effect.tryPromise({
            try: () => redis.client.srem(ACTIVE_ROOMS_KEY, roomId),
            catch: () => new RoomNotFoundError({ roomId }),
          })
        }

        const updatedRoom = yield* findById(roomId)
        if (!updatedRoom) return yield* new RoomNotFoundError({ roomId })
        return updatedRoom
      })

    const updatePlayerReady = (
      roomId: string,
      playerId: string,
      ready: boolean
    ): Effect.Effect<Room, RoomError> =>
      Effect.gen(function* () {
        const room = yield* findById(roomId)
        if (!room) return yield* new RoomNotFoundError({ roomId })

        const player = room.players.find((p) => p.id === playerId)
        if (!player) return yield* new RoomNotFoundError({ roomId })

        const updatedPlayer = { ...player, ready }
        const playersKey = `${ROOM_PLAYERS_PREFIX}${roomId}`
        yield* redis
          .hset(playersKey, playerId, serializePlayer(updatedPlayer))
          .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))

        const result = yield* findById(roomId)
        if (!result) return yield* new RoomNotFoundError({ roomId })
        return result
      })

    const updateStatus = (roomId: string, status: Room['status']): Effect.Effect<Room, RoomError> =>
      Effect.gen(function* () {
        const room = yield* findById(roomId)
        if (!room) return yield* new RoomNotFoundError({ roomId })

        const updatedRoom = { ...room, status }
        const roomKey = `${ROOM_KEY_PREFIX}${roomId}`
        yield* redis
          .set(roomKey, serializeRoom(updatedRoom), gameConfig.roomTtlSeconds)
          .pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))

        return updatedRoom
      })

    const deleteRoom = (roomId: string): Effect.Effect<void, RoomError> =>
      Effect.gen(function* () {
        const roomKey = `${ROOM_KEY_PREFIX}${roomId}`
        const playersKey = `${ROOM_PLAYERS_PREFIX}${roomId}`

        yield* redis.del(roomKey).pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))
        yield* redis.del(playersKey).pipe(Effect.catchAll((err) => Effect.fail(mapRedisError(err))))
        yield* Effect.tryPromise({
          try: () => redis.client.srem(ACTIVE_ROOMS_KEY, roomId),
          catch: () => new RoomNotFoundError({ roomId }),
        })
      })

    const findActiveRooms = (): Effect.Effect<Room[], RoomError> =>
      Effect.gen(function* () {
        const roomIds = yield* Effect.tryPromise({
          try: () => redis.client.smembers(ACTIVE_ROOMS_KEY),
          catch: () => new RoomNotFoundError({ roomId: 'active' }),
        })

        const rooms = yield* Effect.all(
          roomIds.map((id) => findById(id)),
          { concurrency: gameConfig.roomMaxConcurrency }
        )

        return rooms.filter((r): r is Room => r !== null)
      })

    return RoomRepositoryImpl.of({
      create,
      findById,
      addPlayer,
      removePlayer,
      updatePlayerReady,
      updateStatus,
      delete: deleteRoom,
      findActiveRooms,
    })
  })
)
