import { describe, test, expect } from 'bun:test'
import { Effect, Layer } from 'effect'
import { AuthService, AuthServiceLive } from '../../src/modules/auth/application/services/auth.service'
import { InvalidCredentialsError } from '../../src/modules/auth/domain/errors/auth.errors'
import { DatabaseServiceLive } from '../../src/services/database.service'
import { ConfigLayer } from '../../src/layers/index'

describe('AuthService', () => {
  const TestLayer = Layer.provide(AuthServiceLive, Layer.mergeAll(ConfigLayer, DatabaseServiceLive))

  const runTest = <A, E>(effect: Effect.Effect<A, E, AuthService>) =>
    Effect.runPromise(Effect.provide(effect, TestLayer) as Effect.Effect<A, E, never>)

  const testEmail = `test-${Date.now()}@example.com`
  const testUsername = `testuser-${Date.now()}`

  test('should register a new user', async () => {
    const result = await runTest(
      Effect.gen(function* () {
        const authService = yield* AuthService
        return yield* authService.register({
          email: testEmail,
          username: testUsername,
          password: 'TestPassword123!',
        })
      })
    )

    expect(result.user).toBeDefined()
    expect(result.user.email).toBe(testEmail)
    expect(result.user.username).toBe(testUsername)
    expect(result.token).toBeDefined()
    expect(result.session).toBeDefined()
  })

  test('should login with valid credentials', async () => {
    const result = await runTest(
      Effect.gen(function* () {
        const authService = yield* AuthService
        return yield* authService.login({
          email: testEmail,
          password: 'TestPassword123!',
        })
      })
    )

    expect(result.user).toBeDefined()
    expect(result.user.email).toBe(testEmail)
    expect(result.token).toBeDefined()
  })

  test('should fail login with invalid credentials', async () => {
    const result = await runTest(
      Effect.gen(function* () {
        const authService = yield* AuthService
        return yield* authService.login({
          email: testEmail,
          password: 'WrongPassword!',
        })
      })
    ).catch((e) => e)

    expect(result).toBeInstanceOf(InvalidCredentialsError)
  })

  test('should validate session', async () => {
    const token = await runTest(
      Effect.gen(function* () {
        const authService = yield* AuthService
        const result = yield* authService.login({
          email: testEmail,
          password: 'TestPassword123!',
        })
        return result.token
      })
    )

    const session = await runTest(
      Effect.gen(function* () {
        const authService = yield* AuthService
        return yield* authService.validateSession(token)
      })
    )

    expect(session.user).toBeDefined()
    expect(session.session).toBeDefined()
  })
})
