export const errorResponse = (status: number, message: string) =>
  Response.json({ error: message }, { status })

export const handleTaggedError = (error: unknown): Response => {
  if (error && typeof error === 'object' && '_tag' in error) {
    const tag = (error as { _tag: string })._tag
    if (tag === 'InvalidCredentialsError') return errorResponse(401, 'Invalid email or password')
    if (tag === 'UnauthorizedError') return errorResponse(401, 'Unauthorized')
    if (tag === 'UserAlreadyExistsError') return errorResponse(409, 'User already exists')
    if (tag === 'PlayerAlreadyExistsError')
      return errorResponse(409, 'Player profile already exists')
    if (tag === 'PlayerNotFoundError') return errorResponse(404, 'Player not found')
    if (tag === 'UserBannedError') return errorResponse(403, 'Account banned')
  }
  return errorResponse(500, 'Internal server error')
}
