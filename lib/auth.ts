import { createHmac, timingSafeEqual } from "crypto"
import { getDb, toCamel } from "./db"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "streamlivee-default-secret-change-in-production"
const AUTH_SECRET = process.env.AUTH_SECRET || JWT_SECRET
const SESSION_COOKIE = "sm_session"
const SESSION_DURATION_DAYS = 30

// ============================================================
// PASSWORD HASHING (using Web Crypto API - no bcrypt dependency needed)
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
  const parts = storedHash.split(":")
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false

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

// ============================================================
// ONE-TIME TOKEN (Stack Auth exchange)
// ============================================================

export function createOneTimeToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + 60 * 1000 })
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url")
  const sig = createHmac("sha256", AUTH_SECRET).update(payloadB64).digest("base64url")
  return `${payloadB64}.${sig}`
}

export function verifyOneTimeToken(token: string): { userId: string } | null {
  try {
    const [payloadB64, sig] = token.split(".")
    if (!payloadB64 || !sig) return null
    const expected = createHmac("sha256", AUTH_SECRET).update(payloadB64).digest("base64url")
    if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"))
    if (!payload.userId || !payload.exp || Date.now() > payload.exp) return null
    return { userId: payload.userId }
  } catch {
    return null
  }
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
    SELECT u.id, u.email, u.name, u.phone, u.role, u.status, u.avatar, u.email_verified, u.created_at, u.updated_at
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

import { auth } from "@/auth"

export async function getCurrentUser() {
  // Check custom sm_session cookie first (set by demo-login and /api/auth/login)
  const sessionToken = await getSessionCookie()
  if (sessionToken) {
    const user = await getSessionUser(sessionToken)
    if (user) return user
  }

  // Fallback: check NextAuth session
  const session = await auth()
  if (!session?.user?.id) return null

  const sql = getDb()
  const rows = await sql`
    SELECT id, email, name, phone, role, status, avatar, email_verified, created_at, updated_at
    FROM users 
    WHERE id = ${session.user.id}
  `
  if (rows.length === 0) return null
  return toCamel(rows[0] as Record<string, unknown>)
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
  role?: "admin" | "studio" | "streamer"
}) {
  const sql = getDb()
  const passwordHash = await hashPassword(data.password)
  const role = data.role ?? "streamer"

  const rows = await sql`
    INSERT INTO users (email, password_hash, name, phone, role)
    VALUES (${data.email}, ${passwordHash}, ${data.name}, ${data.phone ?? null}, ${role})
    RETURNING id, email, name, phone, role, status, avatar, email_verified, created_at, updated_at
  `

  const user = toCamel(rows[0] as Record<string, unknown>)

  // Create wallet for the user
  await sql`INSERT INTO wallets (user_id) VALUES (${user.id as string})`
  // Create credits record
  await sql`INSERT INTO user_credits (user_id) VALUES (${user.id as string})`

  return user
}

/** Get existing user by email, or create one (e.g. for OAuth). Uses a random password so login is only via OAuth. */
export async function getOrCreateUserByOAuth(profile: { email: string; name?: string | null }) {
  const sql = getDb()
  const email = profile.email?.toLowerCase().trim()
  if (!email) return null
  let rows = await sql`SELECT id, email, name, role, status FROM users WHERE email = ${email}`
  if (rows.length > 0) {
    const u = rows[0] as Record<string, unknown>
    if (u.status === "suspended" || u.status === "deactivated") return null
    return toCamel(u)
  }
  const newUser = await createUser({
    email,
    password: crypto.randomUUID(),
    name: (profile.name || email.split("@")[0]).trim() || "User",
    role: "streamer",
  })
  return newUser as Record<string, unknown>
}

export async function updateLastLogin(userId: string) {
  const sql = getDb()
  await sql`UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = ${userId}`
}

// Demo logins: fixed emails and shared password (env DEMO_PASSWORD or "Demo@123")
const DEMO_ACCOUNTS: { email: string; name: string; role: "admin" | "studio" | "streamer" }[] = [
  { email: "admin@streammattic.com", name: "Platform Admin", role: "admin" },
  { email: "john@livestream.pro", name: "Demo Studio", role: "studio" },
  { email: "alice@example.com", name: "Demo Streamer", role: "streamer" },
]

export function getDemoPassword(): string {
  return process.env.DEMO_PASSWORD || "Demo@123"
}

export function isDemoEmail(email: string): boolean {
  const norm = email.toLowerCase().trim()
  return DEMO_ACCOUNTS.some((a) => a.email.toLowerCase() === norm)
}

export function getDemoAccountByEmail(email: string): (typeof DEMO_ACCOUNTS)[0] | null {
  const norm = email.toLowerCase().trim()
  return DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === norm) ?? null
}

/** Get existing user by demo email, or create one (all roles including admin) so demo works without seed. */
export async function getOrCreateDemoUser(email: string): Promise<Record<string, unknown> | null> {
  const sql = getDb()
  const account = getDemoAccountByEmail(email)
  if (!account) return null
  const emailNorm = account.email.toLowerCase()
  const rows = await sql`SELECT id, email, name, role, status FROM users WHERE email = ${emailNorm}`
  if (rows.length > 0) {
    const u = rows[0] as Record<string, unknown>
    if (u.status === "suspended" || u.status === "deactivated") return null
    return toCamel(u) as Record<string, unknown>
  }
  const newUser = await createUser({
    email: account.email,
    password: getDemoPassword(),
    name: account.name,
    role: account.role,
  })
  return newUser as Record<string, unknown>
}
