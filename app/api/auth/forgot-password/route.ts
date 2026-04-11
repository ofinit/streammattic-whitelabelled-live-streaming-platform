import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { EMAIL_SEND_FAILED_MESSAGE, sendPasswordResetEmail } from "@/lib/email"
import { findUserByEmailForLogin } from "@/lib/db-queries"
import { getPublicBaseUrl } from "@/lib/public-base-url"

const RATE_MAX = 5

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  )
}

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")
}

const GENERIC_OK = {
  success: true as const,
  message: "If an account exists for that email, we sent password reset instructions.",
}

export async function POST(req: Request) {
  try {
    const sql = getDb()

    let body: { email?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const raw = typeof body.email === "string" ? body.email : ""
    const emailInput = raw.toLowerCase().trim()

    const ip = clientIp(req)
    await sql`
      DELETE FROM admin_password_reset_tokens WHERE expires_at < NOW()
    `
    await sql`
      DELETE FROM admin_password_reset_rate WHERE created_at < NOW() - INTERVAL '24 hours'
    `

    const countRows = await sql`
      SELECT COUNT(*)::int AS c FROM admin_password_reset_rate
      WHERE ip = ${ip} AND created_at > NOW() - INTERVAL '1 hour'
    `
    const recent = Number((countRows[0] as { c?: unknown })?.c ?? 0)
    if (recent >= RATE_MAX) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
    }

    await sql`INSERT INTO admin_password_reset_rate (ip) VALUES (${ip})`

    if (!emailInput) {
      return NextResponse.json(GENERIC_OK)
    }

    const user = await findUserByEmailForLogin(raw)
    if (!user) {
      return NextResponse.json(GENERIC_OK)
    }

    if (user.status === "suspended" || user.status === "deactivated") {
      return NextResponse.json(GENERIC_OK)
    }

    const userId = String(user.id)
    const canonicalEmail = String(user.email ?? "").toLowerCase().trim()
    if (!canonicalEmail) {
      return NextResponse.json(GENERIC_OK)
    }

    await sql`DELETE FROM admin_password_reset_tokens WHERE user_id = ${userId}`

    const token = generateToken()
    await sql`
      INSERT INTO admin_password_reset_tokens (token, user_id, expires_at)
      VALUES (${token}, ${userId}, NOW() + INTERVAL '1 hour')
    `

    const base = getPublicBaseUrl(req)
    const isAdmin = String(user.role) === "admin"
    const resetPath = isAdmin ? "/admin/reset-password" : "/reset-password"
    const resetUrl = `${base}${resetPath}?token=${encodeURIComponent(token)}`

    const sent = await sendPasswordResetEmail(canonicalEmail, resetUrl)
    if (!sent) {
      await sql`DELETE FROM admin_password_reset_tokens WHERE token = ${token}`
      return NextResponse.json({ error: EMAIL_SEND_FAILED_MESSAGE }, { status: 500 })
    }

    return NextResponse.json(GENERIC_OK)
  } catch (e) {
    console.error("forgot-password:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
