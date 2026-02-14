import { Data } from 'effect'

export class ConfigError extends Data.TaggedError('ConfigError')<{
  readonly message: string
  readonly cause?: unknown
}> {}

export class DatabaseError extends Data.TaggedError('DatabaseError')<{
  readonly message: string
  readonly cause?: unknown
}> {}

export class RedisError extends Data.TaggedError('RedisError')<{
  readonly message: string
  readonly cause?: unknown
}> {}

export class AuthError extends Data.TaggedError('AuthError')<{
  readonly reason: 'invalid_credentials' | 'token_expired' | 'unauthorized' | 'forbidden'
  readonly message: string
}> {}

export class PlayerError extends Data.TaggedError('PlayerError')<{
  readonly reason: 'not_found' | 'already_exists' | 'invalid_input'
  readonly message: string
}> {}

export class RoomError extends Data.TaggedError('RoomError')<{
  readonly reason: 'not_found' | 'full' | 'already_started' | 'not_ready'
  readonly message: string
}> {}

export class MatchError extends Data.TaggedError('MatchError')<{
  readonly reason: 'not_found' | 'not_in_progress' | 'invalid_state'
  readonly message: string
}> {}
