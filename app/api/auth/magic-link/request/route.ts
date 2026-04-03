import { NextResponse } from "next/server"
import { createLoginSession } from "@/lib/login-sessions"
import { createMagicLinkToken } from "@/lib/magic-link-token"
import { sendMagicLinkEmail } from "@/lib/email-magic-link"
import { redis } from "@/lib/redis"

const RATE_LIMIT_KEY_PREFIX = "magic_link:"
const RATE_LIMIT_TTL_SEC = 60
const RATE_LIMIT_MAX = 5

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === "string" ? body.email.trim() : ""
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
    if (redis) {
      const key = `${RATE_LIMIT_KEY_PREFIX}${ip}:${email.toLowerCase()}`
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, RATE_LIMIT_TTL_SEC)
      if (count > RATE_LIMIT_MAX) {
        return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
      }
    }

    const session = await createLoginSession(email)
    const token = createMagicLinkToken(email, session.id)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get("x-forwarded-host") ? `https://${request.headers.get("x-forwarded-host")}` : null) || "http://localhost:3000"
    const verifyUrl = `${baseUrl}/auth/verify-magic?token=${encodeURIComponent(token)}&session=${encodeURIComponent(session.id)}`
    await sendMagicLinkEmail(email, verifyUrl)

    return NextResponse.json({ login_session_id: session.id })
  } catch (e) {
    console.error("Magic link request error:", e)
    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 })
  }
}
