import { Data } from 'effect'

export class TelemetryError extends Data.TaggedError('TelemetryError')<{
  readonly message: string
}> {}

export class MatchNotFoundError extends Data.TaggedError('MatchNotFoundError')<{
  readonly matchId: string
}> {}
