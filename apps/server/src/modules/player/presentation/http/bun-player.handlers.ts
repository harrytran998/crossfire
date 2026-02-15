import { Effect } from 'effect'
import { PlayerService } from '../../application/services/player.service'
import { AuthService } from '../../../auth/application/services/auth.service'
import { errorResponse } from '../../../../http/response'
import { extractBearerToken, parseJsonObject } from '../../../../http/request'
import type { RouteDefinition } from '../../../../http/radix-router'

const allowedRegions = new Set(['ASIA', 'EU', 'NA', 'SA', 'AF', 'OC', 'ME'])

const validOptionalString = (value: unknown, maxLength: number) =>
  typeof value === 'string' && value.length > 0 && value.length <= maxLength

const isValidDisplayName = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 3 && value.length <= 64

const isValidRegion = (value: unknown): value is string =>
  typeof value === 'string' && allowedRegions.has(value)

const isValidLanguage = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z]{2}(-[A-Z]{2})?$/.test(value)

const isValidAvatarUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length === 0 || value.length > 512) {
    return false
  }

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const requireAuthUser = async (
  req: Request,
  runApp: <A, E, R>(effect: Effect.Effect<A, E, R>) => Promise<A>
): Promise<{ userId: string } | Response> => {
  const token = extractBearerToken(req)
  if (!token) {
    return errorResponse(401, 'Unauthorized')
  }

  const authSession = await runApp(
    Effect.gen(function* () {
      const auth = yield* AuthService
      return yield* auth.validateSession(token)
    })
  )

  return { userId: authSession.user.id }
}

const createProfileHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const parsed = await parseJsonObject(req)
  if (!parsed.ok) return parsed.response

  const rawDisplayName = parsed.body.displayName
  if (!isValidDisplayName(rawDisplayName)) {
    return errorResponse(400, 'displayName must be between 3 and 64 characters')
  }

  if (parsed.body.region !== undefined && !isValidRegion(parsed.body.region)) {
    return errorResponse(400, 'region must be one of: ASIA, EU, NA, SA, AF, OC, ME')
  }
  if (parsed.body.language !== undefined && !isValidLanguage(parsed.body.language)) {
    return errorResponse(400, 'language must be in ISO format like en or en-US')
  }

  const region = typeof parsed.body.region === 'string' ? parsed.body.region : undefined
  const language = typeof parsed.body.language === 'string' ? parsed.body.language : undefined

  const player = await runApp(
    Effect.gen(function* () {
      const playerService = yield* PlayerService
      return yield* playerService.createProfile({
        userId: auth.userId,
        displayName: rawDisplayName,
        region,
        language,
      })
    })
  )

  return Response.json({ player }, { status: 201 })
}

const getProfileHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const player = await runApp(
    Effect.gen(function* () {
      const playerService = yield* PlayerService
      return yield* playerService.getProfileByUserId(auth.userId)
    })
  )

  return Response.json({ player })
}

const updateProfileHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const parsed = await parseJsonObject(req)
  if (!parsed.ok) return parsed.response

  if (parsed.body.displayName !== undefined && !isValidDisplayName(parsed.body.displayName)) {
    return errorResponse(400, 'displayName must be between 3 and 64 characters')
  }
  if (parsed.body.avatarUrl !== undefined && !isValidAvatarUrl(parsed.body.avatarUrl)) {
    return errorResponse(400, 'avatarUrl must be a valid http/https URL up to 512 characters')
  }
  if (parsed.body.bio !== undefined && !validOptionalString(parsed.body.bio, 500)) {
    return errorResponse(400, 'bio must be a non-empty string up to 500 characters')
  }
  if (parsed.body.region !== undefined && !isValidRegion(parsed.body.region)) {
    return errorResponse(400, 'region must be one of: ASIA, EU, NA, SA, AF, OC, ME')
  }
  if (parsed.body.language !== undefined && !isValidLanguage(parsed.body.language)) {
    return errorResponse(400, 'language must be in ISO format like en or en-US')
  }

  const player = await runApp(
    Effect.gen(function* () {
      const playerService = yield* PlayerService
      return yield* playerService.updateProfile(auth.userId, {
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

const getStatsHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const stats = await runApp(
    Effect.gen(function* () {
      const playerService = yield* PlayerService
      return yield* playerService.getStatsByUserId(auth.userId)
    })
  )

  return Response.json({ stats })
}

const getProgressionHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const progression = await runApp(
    Effect.gen(function* () {
      const playerService = yield* PlayerService
      return yield* playerService.getProgressionByUserId(auth.userId)
    })
  )

  return Response.json({ progression })
}

export const playerRoutes: readonly RouteDefinition[] = [
  { method: 'POST', path: '/api/players/me', handler: createProfileHandler },
  { method: 'GET', path: '/api/players/me', handler: getProfileHandler },
  { method: 'PATCH', path: '/api/players/me', handler: updateProfileHandler },
  { method: 'GET', path: '/api/players/me/stats', handler: getStatsHandler },
  { method: 'GET', path: '/api/players/me/progression', handler: getProgressionHandler },
]
