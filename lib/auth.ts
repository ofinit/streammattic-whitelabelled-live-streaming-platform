import { compare as bcryptCompare } from "bcryptjs"
import { getDb, toCamel } from "./db"
import { cookies } from "next/headers"
import { getIndianStateName } from "@/lib/indian-states"

const SESSION_COOKIE = "sm_session"
const SESSION_DURATION_DAYS = 30

// ============================================================
// PASSWORD HASHING (PBKDF2 via Web Crypto; bcrypt for legacy DB hashes)
// ============================================================

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("")

  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  )
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  )
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, "0")).join("")
  return `pbkdf2:100000:${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false

  // App-native PBKDF2 (see hashPassword)
  if (storedHash.startsWith("pbkdf2:")) {
    const parts = storedHash.split(":")
    if (parts.length !== 4) return false

    const [, iterStr, saltHex, expectedHash] = parts
    const iterations = parseInt(iterStr, 10)
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(h => parseInt(h, 16)))

    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
    )
    const derivedBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      keyMaterial, 256
    )
    const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, "0")).join("")
    return hashHex === expectedHash
  }

  // Legacy: Postgres crypt()/bcrypt seeds and old imports ($2a$, $2b$, $2y$)
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
    return bcryptCompare(password, storedHash)
  }

  return false
}

/** True if password_hash should be migrated to PBKDF2 on next successful login. */
export function isLegacyPasswordHash(storedHash: string): boolean {
  return (
    storedHash.startsWith("$2a$") ||
    storedHash.startsWith("$2b$") ||
    storedHash.startsWith("$2y$")
  )
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")
}

export async function createSession(userId: string, ip?: string, userAgent?: string) {
  const sql = getDb()
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)

  await sql`
    INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at)
    VALUES (${userId}, ${token}, ${ip ?? null}, ${userAgent ?? null}, ${expiresAt.toISOString()})
  `

  return { token, expiresAt }
}

export async function getSessionUser(token: string) {
  const sql = getDb()
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.phone, u.billing_state, u.role, u.status, u.avatar, u.email_verified, u.mock_data_cleared,
           u.studio_subscription_expires_at, u.created_at, u.updated_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ${token} AND s.expires_at > NOW()
  `
  if (rows.length === 0) return null
  return toCamel(rows[0] as Record<string, unknown>)
}

export async function deleteSession(token: string) {
  const sql = getDb()
  await sql`DELETE FROM sessions WHERE token = ${token}`
}

export async function deleteAllUserSessions(userId: string) {
  const sql = getDb()
  await sql`DELETE FROM sessions WHERE user_id = ${userId}`
}

export async function cleanExpiredSessions() {
  const sql = getDb()
  await sql`DELETE FROM sessions WHERE expires_at < NOW()`
}

// ============================================================
// COOKIE HELPERS (for Route Handlers / Server Components)
// ============================================================

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })
}

export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value ?? null
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}

// ============================================================
// AUTH HELPERS (get current user from request)
// ============================================================

/** Resolve user from HTTP-only `sm_session` (set by POST /api/auth/login). */
export async function getCurrentUser() {
  const sessionToken = await getSessionCookie()
  if (sessionToken) {
    const user = await getSessionUser(sessionToken)
    if (user) return user
  }
  return null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role as string)) {
    throw new Error("Forbidden")
  }
  return user
}

// ============================================================
// USER CREATION
// ============================================================

export async function createUser(data: {
  email: string
  password: string
  name: string
  phone?: string
  /** Indian state code (e.g. KA); optional for admin-created accounts */
  billingState?: string | null
  role?: "admin" | "studio" | "streamer"
}) {
  const sql = getDb()
  const passwordHash = await hashPassword(data.password)
  const role = data.role ?? "streamer"
  const billingStateCode =
    typeof data.billingState === "string" && data.billingState.trim() !== ""
      ? data.billingState.trim().toUpperCase()
      : null
  const stateLabelForGst = billingStateCode ? getIndianStateName(billingStateCode) : null

  const rows = await sql`
    INSERT INTO users (email, password_hash, name, phone, billing_state, role)
    VALUES (${data.email}, ${passwordHash}, ${data.name}, ${data.phone ?? null}, ${billingStateCode}, ${role})
    RETURNING id, email, name, phone, billing_state, role, status, avatar, email_verified, mock_data_cleared, created_at, updated_at
  `

  const user = toCamel(rows[0] as Record<string, unknown>)

  // Create wallet for the user
  await sql`INSERT INTO wallets (user_id) VALUES (${user.id as string})`
  // Create credits record
  await sql`INSERT INTO user_credits (user_id) VALUES (${user.id as string})`

  await sql`
    INSERT INTO gst_configurations (user_id, gst_type, gst_enabled, state)
    VALUES (${user.id as string}, 'individual', false, ${stateLabelForGst})
  `

  if (role === "studio") {
    await sql`
      UPDATE users
      SET studio_subscription_expires_at = NOW() + INTERVAL '1 year', updated_at = NOW()
      WHERE id = ${user.id as string}
    `
  }

  return user
}

export async function updateLastLogin(userId: string) {
  const sql = getDb()
  await sql`UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = ${userId}`
}
