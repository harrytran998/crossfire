import { Data, Schema } from 'effect'
import { HttpServerRespondable, HttpServerResponse } from '@effect/platform'

export class InvalidCredentialsError extends Data.TaggedError('InvalidCredentialsError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }
}

export class UserAlreadyExistsError extends Data.TaggedError('UserAlreadyExistsError')<{
  readonly field: 'email' | 'username'
}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: `${this.field} already registered` }, { status: 409 })
  }
}

export class UserNotFoundError extends Data.TaggedError('UserNotFoundError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: 'User not found' }, { status: 404 })
  }
}

export class SessionExpiredError extends Data.TaggedError('SessionExpiredError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: 'Session expired' }, { status: 401 })
  }
}

export class UnauthorizedError extends Data.TaggedError('UnauthorizedError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export class UserBannedError extends Data.TaggedError('UserBannedError')<{
  readonly reason: string | null
  readonly until: Date | null
}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json(
      {
        error: 'Account banned',
        reason: this.reason,
        until: this.until?.toISOString(),
      },
      { status: 403 }
    )
  }
}

export class EmailNotVerifiedError extends Data.TaggedError('EmailNotVerifiedError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: 'Email not verified' }, { status: 403 })
  }
}

export class RegistrationSchema extends Schema.Class<RegistrationSchema>('RegistrationSchema')({
  username: Schema.String.pipe(
    Schema.minLength(3),
    Schema.maxLength(32),
    Schema.pattern(/^[a-zA-Z0-9_]+$/)
  ),
  email: Schema.String.pipe(Schema.minLength(5), Schema.maxLength(255)),
  password: Schema.String.pipe(Schema.minLength(8), Schema.maxLength(128)),
}) {}

export class LoginSchema extends Schema.Class<LoginSchema>('LoginSchema')({
  email: Schema.String.pipe(Schema.minLength(5), Schema.maxLength(255)),
  password: Schema.String.pipe(Schema.minLength(1)),
}) {}
