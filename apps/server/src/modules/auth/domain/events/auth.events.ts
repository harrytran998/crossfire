import { Data } from 'effect'

export class UserRegistered extends Data.TaggedClass('UserRegistered')<{
  readonly userId: string
  readonly email: string
  readonly username: string
  readonly timestamp: Date
}> {}

export class UserLoggedIn extends Data.TaggedClass('UserLoggedIn')<{
  readonly userId: string
  readonly sessionId: string
  readonly ipAddress: string | null
  readonly timestamp: Date
}> {}

export class UserLoggedOut extends Data.TaggedClass('UserLoggedOut')<{
  readonly userId: string
  readonly sessionId: string
  readonly timestamp: Date
}> {}

export class SessionExpired extends Data.TaggedClass('SessionExpired')<{
  readonly userId: string
  readonly sessionId: string
  readonly timestamp: Date
}> {}
