import { HTTP_STATUS } from './status'

export const errorResponse = (status: number, message: string) =>
  Response.json({ error: message }, { status })

export const handleTaggedError = (error: unknown): Response => {
  if (error && typeof error === 'object' && '_tag' in error) {
    const tag = (error as { _tag: string })._tag
    if (tag === 'InvalidCredentialsError')
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password')
    if (tag === 'UnauthorizedError') return errorResponse(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized')
    if (tag === 'UserAlreadyExistsError')
      return errorResponse(HTTP_STATUS.CONFLICT, 'User already exists')
    if (tag === 'PlayerAlreadyExistsError')
      return errorResponse(HTTP_STATUS.CONFLICT, 'Player profile already exists')
    if (tag === 'PlayerNotFoundError')
      return errorResponse(HTTP_STATUS.NOT_FOUND, 'Player not found')
    if (tag === 'UserBannedError') return errorResponse(HTTP_STATUS.FORBIDDEN, 'Account banned')
  }
  return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error')
}
