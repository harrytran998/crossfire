export type RoomStatus = 'waiting' | 'starting' | 'in_progress' | 'finished'

export interface RoomPlayer {
  readonly id: string
  readonly ready: boolean
  readonly loadoutId: string
  readonly joinedAt: Date
}

export interface Room {
  readonly id: string
  readonly name: string
  readonly hostId: string
  readonly mapId: string
  readonly configId: string
  readonly status: RoomStatus
  readonly players: RoomPlayer[]
  readonly maxPlayers: number
  readonly isPrivate: boolean
  readonly password: string | null
  readonly createdAt: Date
}

export interface CreateRoomInput {
  readonly name: string
  readonly hostId: string
  readonly mapId: string
  readonly configId: string
  readonly maxPlayers?: number
  readonly isPrivate?: boolean
  readonly password?: string
}

export interface JoinRoomInput {
  readonly roomId: string
  readonly playerId: string
  readonly loadoutId: string
  readonly password?: string
}

export interface RoomState {
  readonly roomId: string
  readonly name: string
  readonly hostId: string
  readonly mapId: string
  readonly status: RoomStatus
  readonly players: Array<{
    id: string
    ready: boolean
  }>
  readonly maxPlayers: number
  readonly isPrivate: boolean
}

export const mapRoomToState = (room: Room): RoomState => ({
  roomId: room.id,
  name: room.name,
  hostId: room.hostId,
  mapId: room.mapId,
  status: room.status,
  players: room.players.map(p => ({ id: p.id, ready: p.ready })),
  maxPlayers: room.maxPlayers,
  isPrivate: room.isPrivate,
})
