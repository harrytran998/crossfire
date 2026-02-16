import { Effect, Context, Layer } from 'effect'
import { argon2id, hash, verify } from 'argon2'
import { base64url } from 'jose'

export interface CryptoService {
  readonly hashPassword: (password: string) => Effect.Effect<string>
  readonly verifyPassword: (password: string, hash: string) => Effect.Effect<boolean>
  readonly generateToken: () => Effect.Effect<string>
  readonly hashRefreshToken: (token: string) => Effect.Effect<string>
  readonly verifyRefreshToken: (token: string, hash: string) => Effect.Effect<boolean>
  readonly fingerprintToken: (token: string) => Effect.Effect<string>
}

export const CryptoService = Context.GenericTag<CryptoService>('CryptoService')

const ARGON2_CONFIG = {
  type: argon2id,
} as const

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

export const CryptoServiceLive = Layer.sync(CryptoService, () => {
  const hashPassword = (password: string): Effect.Effect<string> =>
    Effect.promise(async () => hash(password, ARGON2_CONFIG)).pipe(Effect.orDie)

  const verifyPassword = (password: string, hash: string): Effect.Effect<boolean> =>
    Effect.promise(async () => verify(hash, password)).pipe(Effect.orDie)

  const generateToken = (): Effect.Effect<string> =>
    Effect.sync(() => {
      const bytes = new Uint8Array(32)
      crypto.getRandomValues(bytes)
      return base64url.encode(bytes)
    })

  const hashRefreshToken = (token: string): Effect.Effect<string> =>
    Effect.promise(async () => hash(token, ARGON2_CONFIG)).pipe(Effect.orDie)

  const verifyRefreshToken = (token: string, hash: string): Effect.Effect<boolean> =>
    Effect.promise(async () => verify(hash, token)).pipe(Effect.orDie)

  const fingerprintToken = (token: string): Effect.Effect<string> =>
    Effect.promise(async () => {
      const encoded = new TextEncoder().encode(token)
      const digest = await crypto.subtle.digest('SHA-256', encoded)
      return toHex(new Uint8Array(digest))
    }).pipe(Effect.orDie)

  return CryptoService.of({
    hashPassword,
    verifyPassword,
    generateToken,
    hashRefreshToken,
    verifyRefreshToken,
    fingerprintToken,
  })
})
