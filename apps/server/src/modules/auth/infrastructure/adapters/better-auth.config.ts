import type { BetterAuthOptions } from 'better-auth'

export const BetterAuthConfig: Pick<BetterAuthOptions, 'basePath' | 'emailAndPassword'> = {
  basePath: '/api/auth',
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: false,
  },
}
