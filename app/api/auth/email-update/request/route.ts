import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { redis } from "@/lib/redis"

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { newEmail } = await req.json()
    if (!newEmail || typeof newEmail !== "string") {
      return NextResponse.json({ error: "New email is required" }, { status: 400 })
    }

    const normalizedEmail = newEmail.toLowerCase().trim()

    if (normalizedEmail === (user.email as string).toLowerCase().trim()) {
      return NextResponse.json({ error: "This is already your email" }, { status: 400 })
    }

    const sql = getDb()
    const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail} LIMIT 1`
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email is already in use by another account" }, { status: 400 })
    }

    if (!redis) {
      return NextResponse.json(
        { error: "Redis is not configured. Cannot process OTP requests." },
        { status: 500 }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    const key = `email_update_otp:${user.id}`
    const payload = { newEmail: normalizedEmail, otp }
    
    await redis.set(key, payload, { ex: 600 }) // 10 minutes

    // Simulate sending email (in a real app, integrate Resend here)
    console.log(`\n======================================================`)
    console.log(`[EMAIL OTP] To: ${normalizedEmail}`)
    console.log(`[EMAIL OTP] Verification Code for Email Change: ${otp}`)
    console.log(`======================================================\n`)

    return NextResponse.json({ success: true, message: "Verification code sent to new email." })
  } catch (error) {
    console.error("Email update request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
