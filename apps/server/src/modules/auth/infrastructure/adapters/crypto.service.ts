import { Effect, Context, Layer } from 'effect'
import * as bcrypt from 'bcrypt'

export interface CryptoService {
  readonly hashPassword: (password: string) => Effect.Effect<string>
  readonly verifyPassword: (password: string, hash: string) => Effect.Effect<boolean>
  readonly generateToken: () => Effect.Effect<string>
}

export const CryptoService = Context.GenericTag<CryptoService>('CryptoService')

const SALT_ROUNDS = 12

export const CryptoServiceLive = Layer.sync(CryptoService, () => {
  const hashPassword = (password: string): Effect.Effect<string> =>
    Effect.promise(async () => bcrypt.hash(password, SALT_ROUNDS)).pipe(Effect.orDie)

  const verifyPassword = (password: string, hash: string): Effect.Effect<boolean> =>
    Effect.promise(async () => bcrypt.compare(password, hash)).pipe(Effect.orDie)

  const generateToken = (): Effect.Effect<string> =>
    Effect.sync(() => {
      const bytes = new Uint8Array(32)
      crypto.getRandomValues(bytes)
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    })

  return CryptoService.of({
    hashPassword,
    verifyPassword,
    generateToken,
  })
})
