import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { createUser, createSession, setSessionCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Check if email already exists
    const sql = getDb()
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    // Create user (defaults to 'streamer' role)
    const user = await createUser({
      email: email.toLowerCase().trim(),
      password,
      name: `${firstName} ${lastName}`.trim(),
      phone: phone || undefined,
      role: "streamer",
    })

    // Create session
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    const { token, expiresAt } = await createSession(user.id as string, ip, userAgent)

    // Set cookie
    await setSessionCookie(token, expiresAt)

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "An error occurred during registration" }, { status: 500 })
  }
}
