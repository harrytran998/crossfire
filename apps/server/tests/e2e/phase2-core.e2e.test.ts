import { describe, expect, test } from 'bun:test'

describe('E2E: Phase 2 Core APIs', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000'

  const createIdentity = (prefix: string) => {
    const id = `${Date.now()}${Math.floor(Math.random() * 100000)}`
    return {
      email: `${prefix}-${id}@test.com`,
      username: `${prefix}_${id}`,
      password: 'TestPassword123!',
    }
  }

  const registerAndCreatePlayer = async (prefix: string) => {
    const identity = createIdentity(prefix)
    const register = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(identity),
    })

    expect(register.status).toBe(201)
    const registerBody = await register.json()
    const token = registerBody.token as string

    const createPlayer = await fetch(`${API_URL}/api/players/me`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayName: `${prefix}-player`,
      }),
    })
    expect([200, 201, 409]).toContain(createPlayer.status)

    const me = await fetch(`${API_URL}/api/players/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(me.status).toBe(200)
    const meBody = await me.json()

    return {
      token,
      playerId: meBody.player.id as string,
    }
  }

  test('inventory + loadout endpoints', async () => {
    const { token } = await registerAndCreatePlayer('p2inv')

    const weaponsRes = await fetch(`${API_URL}/api/static/weapons`)
    expect(weaponsRes.status).toBe(200)
    const weaponsPayload = await weaponsRes.json()
    const weaponId = weaponsPayload.weapons[0]?.id as string | undefined
    expect(weaponId).toBeDefined()

    const acquireRes = await fetch(`${API_URL}/api/inventory/me/acquire`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ weaponId }),
    })
    expect([200, 201]).toContain(acquireRes.status)

    const inventoryRes = await fetch(`${API_URL}/api/inventory/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(inventoryRes.status).toBe(200)
    const inventoryPayload = await inventoryRes.json()
    expect(Array.isArray(inventoryPayload.inventory)).toBe(true)

    const inventoryItemId = inventoryPayload.inventory[0]?.id as string | undefined
    expect(inventoryItemId).toBeDefined()

    const createLoadoutRes = await fetch(`${API_URL}/api/loadouts/me`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'E2E Loadout',
        slot: 1,
        primaryWeaponId: inventoryItemId,
      }),
    })
    expect([201, 409]).toContain(createLoadoutRes.status)

    const loadoutsRes = await fetch(`${API_URL}/api/loadouts/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(loadoutsRes.status).toBe(200)
  })

  test('match + leaderboard list endpoints', async () => {
    const { token } = await registerAndCreatePlayer('p2ml')

    const matchesRes = await fetch(`${API_URL}/api/matches/me?page=1&pageSize=10`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(matchesRes.status).toBe(200)

    const leaderboardsRes = await fetch(
      `${API_URL}/api/leaderboards?page=1&pageSize=10&includeCurrentPlayerRank=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    expect(leaderboardsRes.status).toBe(200)
  })

  test('friends request lifecycle endpoints', async () => {
    const first = await registerAndCreatePlayer('p2fr1')
    const second = await registerAndCreatePlayer('p2fr2')

    const requestRes = await fetch(`${API_URL}/api/friends/requests`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${first.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerId: second.playerId }),
    })
    expect([201, 409]).toContain(requestRes.status)

    const incomingRes = await fetch(`${API_URL}/api/friends/requests`, {
      headers: { Authorization: `Bearer ${second.token}` },
    })
    expect(incomingRes.status).toBe(200)
    const incomingPayload = await incomingRes.json()

    const friendshipId = incomingPayload.incoming?.[0]?.id as string | undefined
    if (friendshipId) {
      const acceptRes = await fetch(`${API_URL}/api/friends/requests/${friendshipId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${second.token}` },
      })
      expect([200, 204]).toContain(acceptRes.status)
    }

    const friendsRes = await fetch(`${API_URL}/api/friends`, {
      headers: { Authorization: `Bearer ${first.token}` },
    })
    expect(friendsRes.status).toBe(200)
  })
})
