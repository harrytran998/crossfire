import { describe, test, expect } from 'bun:test'

describe('E2E: Auth API', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000'

  const createIdentity = () => {
    const id = `${Date.now()}${Math.floor(Math.random() * 100000)}`
    return {
      email: `e2e-${id}@test.com`,
      username: `e2euser_${id}`,
      password: 'TestPassword123!',
    }
  }

  const registerAndGetToken = async () => {
    const identity = createIdentity()
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(identity),
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    return { identity, token: data.token as string }
  }

  test('POST /api/auth/register - should register new user', async () => {
    const testUser = createIdentity()
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    })

    expect(response.status).toBe(201)

    const data = await response.json()
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe(testUser.email)
    expect(data.token).toBeDefined()
  })

  test('POST /api/auth/login - should login existing user', async () => {
    const { identity } = await registerAndGetToken()

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: identity.email,
        password: identity.password,
      }),
    })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.user).toBeDefined()
    expect(data.token).toBeDefined()
  })

  test('GET /api/auth/session - should return current session', async () => {
    const { identity, token } = await registerAndGetToken()

    const response = await fetch(`${API_URL}/api/auth/session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe(identity.email)
  })

  test('POST /api/auth/refresh - should refresh token', async () => {
    const { token } = await registerAndGetToken()

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.token).toBeDefined()
    expect(data.token).not.toBe(token)
  })

  test('POST /api/auth/logout - should logout user', async () => {
    const { token } = await registerAndGetToken()

    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.message).toBe('Logged out successfully')
  })
})
