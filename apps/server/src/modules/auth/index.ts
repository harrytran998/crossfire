export {
  mapUserRowToEntity,
  mapSessionRowToEntity,
  type User,
  type Session,
  type CreateUserInput,
  type LoginInput,
  type AuthResult,
  type UserRow,
  type SessionRow,
} from './domain/entities'
export {
  InvalidCredentialsError,
  UserAlreadyExistsError,
  UserNotFoundError,
  SessionExpiredError,
  UnauthorizedError,
  UserBannedError,
  EmailNotVerifiedError,
  RegistrationSchema,
  LoginSchema,
} from './domain/errors'
export { UserRegistered, UserLoggedIn, UserLoggedOut, SessionExpired } from './domain/events'
export type { AuthRepository } from './domain/repositories'
export { AuthService, AuthServiceLive } from './application/services'
export {
  AuthRepository as AuthRepositoryTag,
  AuthRepositoryLive,
} from './infrastructure/repositories'
export { CryptoService, CryptoServiceLive } from './infrastructure/adapters'
export { AuthRoutes, AuthMiddleware, CurrentAuth } from './presentation'
