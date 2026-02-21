import { Effect } from 'effect'
import type { RouteDefinition } from '../../../../http/radix-router'
import { HTTP_STATUS } from '../../../../http/status'
import { errorResponse } from '../../../../http/response'
import { extractBearerToken } from '../../../../http/request'
import { AuthService } from '../../../auth/application/services/auth.service'
import { AchievementService } from '../../application/services/achievement.service'

const requireAuthUser = async (
  req: Request,
  runApp: <A, E, R>(effect: Effect.Effect<A, E, R>) => Promise<A>
): Promise<{ userId: string; role: string } | Response> => {
  const token = extractBearerToken(req)
  if (!token) {
    return errorResponse(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized')
  }

  const authSession = await runApp(
    Effect.gen(function* () {
      const auth = yield* AuthService
      return yield* auth.validateSession(token)
    })
  )

  return { userId: authSession.user.id, role: authSession.user.role }
}

const getAllAchievementsHandler: RouteDefinition['handler'] = async (req, { runApp }) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const achievements = await runApp(
    Effect.gen(function* () {
      const service = yield* AchievementService
      return yield* service.getAllAchievements()
    })
  )

  return Response.json({ achievements })
}

const getPlayerAchievementsHandler: RouteDefinition['handler'] = async (
  req,
  { runApp, params }
) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const playerId = params?.playerId
  if (!playerId) {
    return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Player ID is required')
  }

  if (auth.userId !== playerId && auth.role !== 'admin') {
    return errorResponse(HTTP_STATUS.FORBIDDEN, 'Can only access your own achievements')
  }

  const achievements = await runApp(
    Effect.gen(function* () {
      const service = yield* AchievementService
      return yield* service.getPlayerAchievements(playerId)
    })
  )

  return Response.json({ achievements })
}

const getAchievementProgressHandler: RouteDefinition['handler'] = async (
  req,
  { runApp, params }
) => {
  const auth = await requireAuthUser(req, runApp)
  if (auth instanceof Response) {
    return auth
  }

  const playerId = params?.playerId
  if (!playerId) {
    return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Player ID is required')
  }

  if (auth.userId !== playerId && auth.role !== 'admin') {
    return errorResponse(HTTP_STATUS.FORBIDDEN, 'Can only access your own achievement progress')
  }

  const achievements = await runApp(
    Effect.gen(function* () {
      const service = yield* AchievementService
      return yield* service.getPlayerAchievements(playerId)
    })
  )

  const progress = achievements.map((pa) => ({
    achievementId: pa.achievementId,
    name: pa.achievement.name,
    progress: pa.progress,
    unlockedAt: pa.unlockedAt,
  }))

  return Response.json({ progress })
}

export const achievementRoutes: readonly RouteDefinition[] = [
  { method: 'GET', path: '/api/achievements', handler: getAllAchievementsHandler },
  {
    method: 'GET',
    path: '/api/achievements/player/:playerId',
    handler: getPlayerAchievementsHandler,
  },
  {
    method: 'GET',
    path: '/api/achievements/progress/:playerId',
    handler: getAchievementProgressHandler,
  },
]
