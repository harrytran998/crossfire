import { HTTP_STATUS } from './status'

export const extractBearerToken = (req: Request): string | null => {
  const header = req.headers.get('authorization')
  if (!header || !header.startsWith('Bearer ')) {
    return null
  }
  return header.slice(7)
}

export const parseJsonObject = async (
  request: Request
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; response: Response }> => {
  try {
    const parsed = await request.json()
    const isObject = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
    const prototype = isObject ? Object.getPrototypeOf(parsed) : null

    if (!isObject || (prototype !== Object.prototype && prototype !== null)) {
      return {
        ok: false,
        response: Response.json(
          { error: 'Invalid JSON body' },
          { status: HTTP_STATUS.BAD_REQUEST }
        ),
      }
    }

    return { ok: true, body: parsed as Record<string, unknown> }
  } catch {
    return {
      ok: false,
      response: Response.json(
        { error: 'Malformed JSON body' },
        { status: HTTP_STATUS.BAD_REQUEST }
      ),
    }
  }
}

export const getClientIp = (req: Request): string => {
  const connectingIp = req.headers.get('cf-connecting-ip')?.trim()
  if (connectingIp) {
    return connectingIp
  }

  const trustProxy =
    process.env.TRUST_PROXY === 'true' || process.env.TRUST_X_FORWARDED_FOR === 'true'

  if (trustProxy) {
    const forwardedFor = req.headers.get('x-forwarded-for')
    if (forwardedFor) {
      const first = forwardedFor.split(',')[0]?.trim()
      if (first) {
        return first
      }
    }

    const realIp = req.headers.get('x-real-ip')?.trim()
    if (realIp) {
      return realIp
    }
  }

  return 'unknown'
}
