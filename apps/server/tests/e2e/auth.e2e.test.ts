import { describe, test, expect } from 'bun:test'

describe('E2E: Auth API', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000'
  
  let authToken: string = ''
  const testUser = {
    email: `e2e-${Date.now()}@test.com`,
    username: `e2euser-${Date.now()}`,
    password: 'TestPassword123!',
  }

  test('POST /api/auth/register - should register new user', async () => {
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
    
    authToken = data.token
  })

  test('POST /api/auth/login - should login existing user', async () => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    })

    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.user).toBeDefined()
    expect(data.token).toBeDefined()
    
    authToken = data.token
  })

  test('GET /api/auth/session - should return current session', async () => {
    const response = await fetch(`${API_URL}/api/auth/session`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe(testUser.email)
  })

  test('POST /api/auth/refresh - should refresh token', async () => {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.token).toBeDefined()
    expect(data.token).not.toBe(authToken)
  })

  test('POST /api/auth/logout - should logout user', async () => {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.message).toBe('Logged out successfully')
  })
})
