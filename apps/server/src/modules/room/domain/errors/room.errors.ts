import { Data } from 'effect'

export class RoomNotFoundError extends Data.TaggedError('RoomNotFoundError')<{
  readonly roomId: string
}> {}

export class RoomFullError extends Data.TaggedError('RoomFullError')<{
  readonly roomId: string
  readonly currentPlayers: number
  readonly maxPlayers: number
}> {}

export class NotHostError extends Data.TaggedError('NotHostError')<{
  readonly roomId: string
  readonly playerId: string
}> {}

export class InvalidPasswordError extends Data.TaggedError('InvalidPasswordError')<{
  readonly roomId: string
}> {}

export class PlayerNotInRoomError extends Data.TaggedError('PlayerNotInRoomError')<{
  readonly roomId: string
  readonly playerId: string
}> {}

export class RoomAlreadyStartedError extends Data.TaggedError('RoomAlreadyStartedError')<{
  readonly roomId: string
  readonly status: string
}> {}

export class GameAlreadyInProgressError extends Data.TaggedError('GameAlreadyInProgressError')<{
  readonly roomId: string
}> {}

export class PlayerAlreadyInRoomError extends Data.TaggedError('PlayerAlreadyInRoomError')<{
  readonly roomId: string
  readonly playerId: string
}> {}

export type RoomError =
  | RoomNotFoundError
  | RoomFullError
  | NotHostError
  | InvalidPasswordError
  | PlayerNotInRoomError
  | RoomAlreadyStartedError
  | GameAlreadyInProgressError
  | PlayerAlreadyInRoomError
