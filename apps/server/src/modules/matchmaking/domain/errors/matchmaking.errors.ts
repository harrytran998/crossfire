import { Data } from 'effect'

export class TicketNotFoundError extends Data.TaggedError('TicketNotFoundError')<{
  readonly ticketId: string
}> {}

export class PlayerAlreadyQueuedError extends Data.TaggedError('PlayerAlreadyQueuedError')<{
  readonly playerId: string
}> {}

export class NotInQueueError extends Data.TaggedError('NotInQueueError')<{
  readonly playerId: string
}> {}

export class MatchmakingError extends Data.TaggedError('MatchmakingError')<{
  readonly message: string
}> {}

export type MatchmakingDomainError =
  | TicketNotFoundError
  | PlayerAlreadyQueuedError
  | NotInQueueError
  | MatchmakingError
