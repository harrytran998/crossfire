import { Effect } from 'effect'
import type { AuthService } from '../modules/auth/application/services/auth.service'
import { extractBearerToken, getClientIp } from '../http/request'
import { errorResponse } from '../http/response'
import { HTTP_STATUS } from '../http/status'

export interface WebSocketAuthSuccess {
  readonly ok: true
  readonly playerId: string
}

export interface WebSocketAuthFailure {
  readonly ok: false
  readonly response: Response
}

export type WebSocketAuthResult = WebSocketAuthSuccess | WebSocketAuthFailure

const getTaggedErrorName = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null) {
    return null
  }

  const maybeTag = Reflect.get(error, '_tag')
  if (typeof maybeTag !== 'string') {
    return null
  }

  return maybeTag
}

export const authenticateWebSocketUpgrade = async (
  req: Request,
  authService: AuthService
): Promise<WebSocketAuthResult> => {
  const token = extractBearerToken(req)
  if (!token) {
    return {
      ok: false,
      response: errorResponse(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized'),
    }
  }

  try {
    const { user } = await Effect.runPromise(
      authService.validateSession(token, {
        ipAddress: getClientIp(req),
        userAgent: req.headers.get('user-agent'),
      })
    )

    return {
      ok: true,
      playerId: user.id,
    }
  } catch (error) {
    const tag = getTaggedErrorName(error)

    if (tag === 'UnauthorizedError' || tag === 'InvalidCredentialsError' || tag === 'UserBannedError') {
      return {
        ok: false,
        response: errorResponse(HTTP_STATUS.FORBIDDEN, 'Forbidden'),
      }
    }

    return {
      ok: false,
      response: errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error'),
    }
  }
}
