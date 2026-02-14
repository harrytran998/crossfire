import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'

interface Database {
  users: {
    id: string
    username: string
    email: string
    password_hash: string
    email_verified: boolean
    is_active: boolean
    is_banned: boolean
    created_at: Date
    updated_at: Date
    last_login_at: Date | null
  }
  players: {
    id: string
    user_id: string
    display_name: string
    avatar_url: string | null
    bio: string | null
    region: string
    language: string
    created_at: Date
    updated_at: Date
  }
  weapons: {
    id: string
    weapon_key: string
    name: string
    weapon_type: string
    rarity: string
    base_damage: number
    fire_rate: number | null
    magazine_size: number | null
    reload_time: number | null
    accuracy: number | null
    range_meters: number | null
    unlock_level: number
    is_active: boolean
    stats: Record<string, unknown>
    created_at: Date
  }
}

async function seed() {
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString:
          process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/crossfire',
        max: 10,
      }),
    }),
  })

  try {
    const weapons = [
      {
        weapon_key: 'ak47',
        name: 'AK-47',
        weapon_type: 'assault_rifle',
        rarity: 'common',
        base_damage: 35,
        fire_rate: 10,
        magazine_size: 30,
        reload_time: 2.5,
        accuracy: 0.75,
        range_meters: 400,
        unlock_level: 1,
      },
      {
        weapon_key: 'm4a1',
        name: 'M4A1',
        weapon_type: 'assault_rifle',
        rarity: 'common',
        base_damage: 30,
        fire_rate: 11,
        magazine_size: 30,
        reload_time: 2.3,
        accuracy: 0.85,
        range_meters: 350,
        unlock_level: 1,
      },
      {
        weapon_key: 'awp',
        name: 'AWP',
        weapon_type: 'sniper',
        rarity: 'rare',
        base_damage: 115,
        fire_rate: 0.8,
        magazine_size: 5,
        reload_time: 3.5,
        accuracy: 0.98,
        range_meters: 1000,
        unlock_level: 5,
      },
      {
        weapon_key: 'mp5',
        name: 'MP5',
        weapon_type: 'smg',
        rarity: 'common',
        base_damage: 25,
        fire_rate: 13,
        magazine_size: 30,
        reload_time: 2.0,
        accuracy: 0.8,
        range_meters: 200,
        unlock_level: 1,
      },
      {
        weapon_key: 'desert_eagle',
        name: 'Desert Eagle',
        weapon_type: 'pistol',
        rarity: 'common',
        base_damage: 55,
        fire_rate: 2,
        magazine_size: 7,
        reload_time: 2.2,
        accuracy: 0.7,
        range_meters: 150,
        unlock_level: 1,
      },
    ]

    for (const weapon of weapons) {
      await db
        .insertInto('weapons')
        .values({
          ...weapon,
          stats: {},
          is_active: true,
          created_at: new Date(),
        })
        .onConflict((oc) => oc.column('weapon_key').doNothing())
        .execute()
    }

    console.log('Seed completed successfully!')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  } finally {
    await db.destroy()
  }
}

seed()
