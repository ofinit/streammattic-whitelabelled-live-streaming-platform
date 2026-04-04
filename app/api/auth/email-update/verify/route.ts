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

    const { otp } = await req.json()
    if (!otp || typeof otp !== "string") {
      return NextResponse.json({ error: "Verification code is required" }, { status: 400 })
    }

    if (!redis) {
      return NextResponse.json(
        { error: "Redis is not configured. Cannot process OTP verifications." },
        { status: 500 }
      )
    }

    const key = `email_update_otp:${user.id}`
    const payload = await redis.get<{ newEmail: string; otp: string }>(key)

    if (!payload || !payload.newEmail || !payload.otp) {
      return NextResponse.json({ error: "Verification code has expired or is invalid." }, { status: 400 })
    }

    if (payload.otp !== otp.trim()) {
      return NextResponse.json({ error: "Incorrect verification code." }, { status: 400 })
    }

    // OTP matches! Update the database
    const sql = getDb()
    
    // Safety check again just in case the email was taken in the last 10 minutes
    const existing = await sql`SELECT id FROM users WHERE email = ${payload.newEmail} LIMIT 1`
    if (existing.length > 0) {
      await redis.del(key)
      return NextResponse.json({ error: "Email was taken by another account while pending verification." }, { status: 400 })
    }

    await sql`
      UPDATE users 
      SET 
        email = ${payload.newEmail}, 
        email_verified = true,
        updated_at = NOW()
      WHERE id = ${user.id}
    `

    // Clean up cache
    await redis.del(key)

    return NextResponse.json({ success: true, email: payload.newEmail })
  } catch (error) {
    console.error("Email update verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
