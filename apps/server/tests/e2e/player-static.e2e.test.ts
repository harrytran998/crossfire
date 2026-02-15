import { describe, expect, test } from 'bun:test'

const runE2E = process.env.RUN_E2E === 'true'
const e2eTest = runE2E ? test : test.skip

describe('E2E: Player + Static APIs', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000'

  let authToken = ''
  const identity = {
    email: `e2e-player-${Date.now()}@test.com`,
    username: `e2e-player-${Date.now()}`,
    password: 'TestPassword123!',
  }

  e2eTest('register/login and create player profile', async () => {
    const register = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(identity),
    })

    expect(register.status).toBe(201)
    authToken = (await register.json()).token

    const createPlayer = await fetch(`${API_URL}/api/players/me`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayName: 'E2E Soldier',
        region: 'ASIA',
        language: 'en',
      }),
    })

    expect(createPlayer.status).toBe(201)
    const payload = await createPlayer.json()
    expect(payload.player.displayName).toBe('E2E Soldier')
  })

  e2eTest('get player stats and progression', async () => {
    const stats = await fetch(`${API_URL}/api/players/me/stats`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(stats.status).toBe(200)

    const progression = await fetch(`${API_URL}/api/players/me/progression`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(progression.status).toBe(200)
  })

  e2eTest('get weapons and maps static data', async () => {
    const weaponsRes = await fetch(`${API_URL}/api/static/weapons`)
    expect(weaponsRes.status).toBe(200)

    const mapsRes = await fetch(`${API_URL}/api/static/maps`)
    expect(mapsRes.status).toBe(200)
    const mapsPayload = await mapsRes.json()
    expect(Array.isArray(mapsPayload.maps)).toBe(true)
  })
})
