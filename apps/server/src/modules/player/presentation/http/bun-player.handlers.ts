import { Effect } from 'effect'
import { PlayerService } from '../../application/services/player.service'
import { AuthService } from '../../../auth/application/services/auth.service'
import { errorResponse } from '../../../../http/response'
import { extractBearerToken, parseJsonObject } from '../../../../http/request'

const playerBasePath = '/api/players/me'

const validOptionalString = (value: unknown, maxLength: number) =>
  typeof value === 'string' && value.length > 0 && value.length <= maxLength

const isValidDisplayName = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 3 && value.length <= 64

export const handlePlayerRequest = async (
  req: Request,
  path: string,
  runApp: <A, E, R>(effect: Effect.Effect<A, E, R>) => Promise<A>
): Promise<Response | null> => {
  if (!path.startsWith(playerBasePath)) {
    return null
  }

  const token = extractBearerToken(req)
  if (!token) return errorResponse(401, 'Unauthorized')

  const authSession = await runApp(
    Effect.gen(function* () {
      const auth = yield* AuthService
      return yield* auth.validateSession(token)
    })
  )

  if (path === playerBasePath && req.method === 'POST') {
    const parsed = await parseJsonObject(req)
    if (!parsed.ok) return parsed.response

    const rawDisplayName = parsed.body.displayName
    if (!isValidDisplayName(rawDisplayName)) {
      return errorResponse(400, 'displayName must be between 3 and 64 characters')
    }
    const displayName = rawDisplayName

    const region = typeof parsed.body.region === 'string' ? parsed.body.region : undefined
    const language = typeof parsed.body.language === 'string' ? parsed.body.language : undefined

    const player = await runApp(
      Effect.gen(function* () {
        const playerService = yield* PlayerService
        return yield* playerService.createProfile({
          userId: authSession.user.id,
          displayName,
          region,
          language,
        })
      })
    )

    return Response.json({ player }, { status: 201 })
  }

  if (path === playerBasePath && req.method === 'GET') {
    const player = await runApp(
      Effect.gen(function* () {
        const playerService = yield* PlayerService
        return yield* playerService.getProfileByUserId(authSession.user.id)
      })
    )

    return Response.json({ player })
  }

  if (path === playerBasePath && req.method === 'PATCH') {
    const parsed = await parseJsonObject(req)
    if (!parsed.ok) return parsed.response

    if (parsed.body.displayName !== undefined && !isValidDisplayName(parsed.body.displayName)) {
      return errorResponse(400, 'displayName must be between 3 and 64 characters')
    }
    if (parsed.body.avatarUrl !== undefined && !validOptionalString(parsed.body.avatarUrl, 512)) {
      return errorResponse(400, 'avatarUrl must be a non-empty string up to 512 characters')
    }
    if (parsed.body.bio !== undefined && !validOptionalString(parsed.body.bio, 500)) {
      return errorResponse(400, 'bio must be a non-empty string up to 500 characters')
    }

    const player = await runApp(
      Effect.gen(function* () {
        const playerService = yield* PlayerService
        return yield* playerService.updateProfile(authSession.user.id, {
          displayName:
            typeof parsed.body.displayName === 'string' ? parsed.body.displayName : undefined,
          avatarUrl: typeof parsed.body.avatarUrl === 'string' ? parsed.body.avatarUrl : undefined,
          bio: typeof parsed.body.bio === 'string' ? parsed.body.bio : undefined,
          region: typeof parsed.body.region === 'string' ? parsed.body.region : undefined,
          language: typeof parsed.body.language === 'string' ? parsed.body.language : undefined,
        })
      })
    )

    return Response.json({ player })
  }

  if (path === `${playerBasePath}/stats` && req.method === 'GET') {
    const stats = await runApp(
      Effect.gen(function* () {
        const playerService = yield* PlayerService
        return yield* playerService.getStatsByUserId(authSession.user.id)
      })
    )

    return Response.json({ stats })
  }

  if (path === `${playerBasePath}/progression` && req.method === 'GET') {
    const progression = await runApp(
      Effect.gen(function* () {
        const playerService = yield* PlayerService
        return yield* playerService.getProgressionByUserId(authSession.user.id)
      })
    )

    return Response.json({ progression })
  }

  return null
}
