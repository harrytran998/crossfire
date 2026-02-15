import type { Users, Sessions } from '@crossfire/database'

export type UserRow = Users
export type SessionRow = Sessions

export interface User {
  readonly id: string
  readonly username: string
  readonly email: string
  readonly passwordHash: string
  readonly emailVerified: boolean
  readonly isActive: boolean
  readonly isBanned: boolean
  readonly bannedUntil: Date | null
  readonly banReason: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly lastLoginAt: Date | null
}

export interface Session {
  readonly id: string
  readonly userId: string
  readonly refreshToken: string
  readonly ipAddress: string | null
  readonly userAgent: string | null
  readonly createdAt: Date
  readonly expiresAt: Date
  readonly revokedAt: Date | null
}

export interface CreateUserInput {
  readonly username: string
  readonly email: string
  readonly password: string
}

export interface LoginInput {
  readonly email: string
  readonly password: string
}

export interface AuthResult {
  readonly user: User
  readonly session: Session
  readonly token: string
}

export const mapUserRowToEntity = (row: UserRow): User => ({
  id: row.id as unknown as string,
  username: row.username,
  email: row.email,
  passwordHash: row.password_hash,
  emailVerified: (row.email_verified ?? false) as unknown as boolean,
  isActive: (row.is_active ?? true) as unknown as boolean,
  isBanned: (row.is_banned ?? false) as unknown as boolean,
  bannedUntil: row.banned_until as unknown as Date | null,
  banReason: row.ban_reason,
  createdAt: row.created_at as unknown as Date,
  updatedAt: row.updated_at as unknown as Date,
  lastLoginAt: row.last_login_at as unknown as Date | null,
})

export const mapSessionRowToEntity = (row: SessionRow): Session => ({
  id: row.id as unknown as string,
  userId: row.user_id,
  refreshToken: row.refresh_token,
  ipAddress: row.ip_address,
  userAgent: row.user_agent,
  createdAt: row.created_at as unknown as Date,
  expiresAt: row.expires_at as unknown as Date,
  revokedAt: row.revoked_at as unknown as Date | null,
})
