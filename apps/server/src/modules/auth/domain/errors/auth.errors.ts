import { Data, Schema } from 'effect'
import { HttpServerRespondable, HttpServerResponse } from '@effect/platform'
import { HTTP_STATUS } from '../../../../http/status'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_LOWERCASE_PATTERN = /[a-z]/
const PASSWORD_UPPERCASE_PATTERN = /[A-Z]/
const PASSWORD_NUMBER_PATTERN = /\d/
const PASSWORD_SPECIAL_PATTERN = /[^a-zA-Z0-9]/

export class InvalidCredentialsError extends Data.TaggedError('InvalidCredentialsError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json(
      { error: 'Invalid email or password' },
      { status: HTTP_STATUS.UNAUTHORIZED }
    )
  }
}

export class UserAlreadyExistsError extends Data.TaggedError('UserAlreadyExistsError')<{
  readonly field: 'email' | 'username'
}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json(
      { error: `${this.field} already registered` },
      { status: HTTP_STATUS.CONFLICT }
    )
  }
}

export class UserNotFoundError extends Data.TaggedError('UserNotFoundError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: 'User not found' }, { status: HTTP_STATUS.NOT_FOUND })
  }
}

export class SessionExpiredError extends Data.TaggedError('SessionExpiredError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json(
      { error: 'Session expired' },
      { status: HTTP_STATUS.UNAUTHORIZED }
    )
  }
}

export class UnauthorizedError extends Data.TaggedError('UnauthorizedError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED })
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
      { status: HTTP_STATUS.FORBIDDEN }
    )
  }
}

export class EmailNotVerifiedError extends Data.TaggedError('EmailNotVerifiedError')<{}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json(
      { error: 'Email not verified' },
      { status: HTTP_STATUS.FORBIDDEN }
    )
  }
}

export class ForbiddenError extends Data.TaggedError('ForbiddenError')<{
  readonly message: string
}> {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json(
      { error: this.message },
      { status: HTTP_STATUS.FORBIDDEN }
    )
  }
}

export class RegistrationSchema extends Schema.Class<RegistrationSchema>('RegistrationSchema')({
  username: Schema.String.pipe(
    Schema.minLength(3),
    Schema.maxLength(32),
    Schema.pattern(/^[a-zA-Z0-9_]+$/)
  ),
  email: Schema.String.pipe(
    Schema.minLength(5),
    Schema.maxLength(255),
    Schema.pattern(EMAIL_PATTERN)
  ),
  password: Schema.String.pipe(
    Schema.minLength(8),
    Schema.maxLength(128),
    Schema.pattern(PASSWORD_LOWERCASE_PATTERN),
    Schema.pattern(PASSWORD_UPPERCASE_PATTERN),
    Schema.pattern(PASSWORD_NUMBER_PATTERN),
    Schema.pattern(PASSWORD_SPECIAL_PATTERN)
  ),
}) {}

export class LoginSchema extends Schema.Class<LoginSchema>('LoginSchema')({
  email: Schema.String.pipe(
    Schema.minLength(5),
    Schema.maxLength(255),
    Schema.pattern(EMAIL_PATTERN)
  ),
  password: Schema.String.pipe(Schema.minLength(1)),
}) {}
