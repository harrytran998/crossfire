import { HTTP_STATUS } from './status'

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:5173']

const parseAllowedOrigins = (): Set<string> => {
  const raw = process.env.CORS_ALLOWED_ORIGINS
  const origins = raw
    ? raw
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    : DEFAULT_ALLOWED_ORIGINS

  return new Set(origins)
}

const allowedOrigins = parseAllowedOrigins()

const isAllowedOrigin = (origin: string | null): origin is string => {
  if (!origin) {
    return false
  }

  return allowedOrigins.has(origin)
}

const isStateChangingMethod = (method: string): boolean =>
  method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE'

const applyCorsHeaders = (headers: Headers, origin: string | null): void => {
  if (!isAllowedOrigin(origin)) {
    return
  }

  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')
  headers.set('Access-Control-Max-Age', '600')
  headers.set('Vary', 'Origin')
}

export const handlePreflightRequest = (req: Request): Response | null => {
  if (req.method !== 'OPTIONS') {
    return null
  }

  const origin = req.headers.get('origin')
  if (!isAllowedOrigin(origin)) {
    return Response.json({ error: 'Origin not allowed' }, { status: HTTP_STATUS.FORBIDDEN })
  }

  const headers = new Headers()
  applyCorsHeaders(headers, origin)

  return new Response(null, { status: HTTP_STATUS.NO_CONTENT, headers })
}

export const enforceRequestSecurity = (req: Request): Response | null => {
  const origin = req.headers.get('origin')
  if (origin && !isAllowedOrigin(origin)) {
    return Response.json({ error: 'Origin not allowed' }, { status: HTTP_STATUS.FORBIDDEN })
  }

  if (!isStateChangingMethod(req.method)) {
    return null
  }

  const cookie = req.headers.get('cookie')
  if (!cookie) {
    return null
  }

  const csrfToken = req.headers.get('x-csrf-token')
  if (!csrfToken) {
    return Response.json(
      { error: 'Missing CSRF token for cookie-authenticated request' },
      { status: HTTP_STATUS.FORBIDDEN }
    )
  }

  return null
}

export const applySecurityHeaders = (res: Response, req: Request): Response => {
  const headers = new Headers(res.headers)
  const origin = req.headers.get('origin')

  applyCorsHeaders(headers, origin)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  headers.set('Cross-Origin-Resource-Policy', 'same-site')
  headers.set(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
  )

  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  })
}
