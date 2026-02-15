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
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        ok: false,
        response: Response.json({ error: 'Invalid JSON body' }, { status: 400 }),
      }
    }

    return { ok: true, body: parsed as Record<string, unknown> }
  } catch {
    return {
      ok: false,
      response: Response.json({ error: 'Malformed JSON body' }, { status: 400 }),
    }
  }
}
