import { Context, Effect, Option } from 'effect'
import type { Room, RoomError } from './room'

export interface RoomRepository {
  readonly create: (room: Room) => Effect.Effect<Room, RoomError>
  readonly findById: (id: string) => Effect.Effect<Option<Room>, never>
  readonly findByPlayerId: (playerId: string) => Effect.Effect<Option<Room>, never>
  readonly update: (room: Room) => Effect.Effect<Room, RoomError>
  readonly delete: (id: string) => Effect.Effect<void, never>
  readonly listPublic: (limit?: number) => Effect.Effect<Room[], never>
}

export const RoomRepository = Context.Tag<RoomRepository>()
