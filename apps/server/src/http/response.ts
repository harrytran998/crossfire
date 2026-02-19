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
    if (tag === 'InventoryWeaponNotFoundError')
      return errorResponse(HTTP_STATUS.NOT_FOUND, 'Weapon not found')
    if (tag === 'LoadoutNotFoundError')
      return errorResponse(HTTP_STATUS.NOT_FOUND, 'Loadout not found')
    if (tag === 'LoadoutSlotTakenError')
      return errorResponse(HTTP_STATUS.CONFLICT, 'Loadout slot is already used')
    if (tag === 'LoadoutItemOwnershipError')
      return errorResponse(
        HTTP_STATUS.FORBIDDEN,
        'Selected inventory item does not belong to player'
      )
    if (tag === 'MatchNotFoundError') return errorResponse(HTTP_STATUS.NOT_FOUND, 'Match not found')
    if (tag === 'LeaderboardNotFoundError')
      return errorResponse(HTTP_STATUS.NOT_FOUND, 'Leaderboard not found')
    if (tag === 'FriendRequestNotFoundError')
      return errorResponse(HTTP_STATUS.NOT_FOUND, 'Friend request not found')
    if (tag === 'FriendSelfRequestError')
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Cannot send friend request to yourself')
    if (tag === 'FriendRequestConflictError')
      return errorResponse(HTTP_STATUS.CONFLICT, 'Friend request conflict')
    if (tag === 'FriendRelationNotFoundError')
      return errorResponse(HTTP_STATUS.NOT_FOUND, 'Friend not found')
  }
  return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error')
}
