import { Effect } from 'effect'
import type { Room, RoomPlayer, CreateRoomInput } from '../entities/room.entity'
import type { RoomError } from '../errors/room.errors'

export interface RoomRepository {
  readonly create: (input: CreateRoomInput) => Effect.Effect<Room, RoomError>
  readonly findById: (roomId: string) => Effect.Effect<Room | null, RoomError>
  readonly addPlayer: (roomId: string, player: RoomPlayer) => Effect.Effect<Room, RoomError>
  readonly removePlayer: (roomId: string, playerId: string) => Effect.Effect<Room, RoomError>
  readonly updatePlayerReady: (
    roomId: string,
    playerId: string,
    ready: boolean
  ) => Effect.Effect<Room, RoomError>
  readonly updateStatus: (roomId: string, status: Room['status']) => Effect.Effect<Room, RoomError>
  readonly delete: (roomId: string) => Effect.Effect<void, RoomError>
  readonly findActiveRooms: () => Effect.Effect<Room[], RoomError>
}
