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

export const mapUserRowToEntity = (row: UserRow): User => {
  const safeRow = row as unknown as Record<string, unknown>
  return {
    id: String(safeRow.id),
    username: String(safeRow.username),
    email: String(safeRow.email),
    passwordHash: String(safeRow.password_hash),
    emailVerified: Boolean(safeRow.email_verified ?? false),
    isActive: Boolean(safeRow.is_active ?? true),
    isBanned: Boolean(safeRow.is_banned ?? false),
    bannedUntil: safeRow.banned_until as Date | null,
    banReason: safeRow.ban_reason as string | null,
    createdAt: safeRow.created_at as Date,
    updatedAt: safeRow.updated_at as Date,
    lastLoginAt: safeRow.last_login_at as Date | null,
  }
}

export const mapSessionRowToEntity = (row: SessionRow): Session => {
  const safeRow = row as unknown as Record<string, unknown>
  return {
    id: String(safeRow.id),
    userId: String(safeRow.user_id),
    refreshToken: String(safeRow.refresh_token),
    ipAddress: safeRow.ip_address as string | null,
    userAgent: safeRow.user_agent as string | null,
    createdAt: safeRow.created_at as Date,
    expiresAt: safeRow.expires_at as Date,
    revokedAt: safeRow.revoked_at as Date | null,
  }
}
