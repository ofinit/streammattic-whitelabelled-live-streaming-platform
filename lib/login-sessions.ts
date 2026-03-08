import { getDb } from "./db"

const TTL_MINUTES = 15

export type LoginSessionStatus = "pending" | "approved"

export interface LoginSession {
  id: string
  email: string
  status: LoginSessionStatus
  userId: string | null
  createdAt: Date
  expiresAt: Date
}

export async function createLoginSession(email: string): Promise<LoginSession> {
  const sql = getDb()
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000)
  const rows = await sql`
    INSERT INTO login_sessions (email, status, expires_at)
    VALUES (${email.toLowerCase().trim()}, 'pending', ${expiresAt.toISOString()})
    RETURNING id, email, status, user_id, created_at, expires_at
  `
  const r = rows[0] as Record<string, unknown>
  return {
    id: r.id as string,
    email: r.email as string,
    status: r.status as LoginSessionStatus,
    userId: r.user_id as string | null,
    createdAt: new Date(r.created_at as string),
    expiresAt: new Date(r.expires_at as string),
  }
}

export async function getLoginSession(id: string): Promise<LoginSession | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, email, status, user_id, created_at, expires_at
    FROM login_sessions
    WHERE id = ${id} AND expires_at > NOW()
  `
  if (rows.length === 0) return null
  const r = rows[0] as Record<string, unknown>
  return {
    id: r.id as string,
    email: r.email as string,
    status: r.status as LoginSessionStatus,
    userId: r.user_id as string | null,
    createdAt: new Date(r.created_at as string),
    expiresAt: new Date(r.expires_at as string),
  }
}

export async function approveLoginSession(sessionId: string, userId: string): Promise<boolean> {
  const sql = getDb()
  const result = await sql`
    UPDATE login_sessions
    SET status = 'approved', user_id = ${userId}
    WHERE id = ${sessionId} AND status = 'pending' AND expires_at > NOW()
    RETURNING id
  `
  return result.length > 0
}
