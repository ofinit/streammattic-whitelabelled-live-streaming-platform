import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { createUser, createSession, setSessionCookie } from "@/lib/auth"
import { isValidIndianStateCode, normalizeIndianMobile } from "@/lib/indian-states"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      fullName,
      phone,
      billingState,
      firstName,
      lastName,
    } = body as Record<string, string | undefined>

    const nameFromLegacy =
      typeof firstName === "string" && typeof lastName === "string"
        ? `${firstName} ${lastName}`.trim()
        : ""
    const name =
      typeof fullName === "string" && fullName.trim().length > 0 ? fullName.trim() : nameFromLegacy

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Full name, email, and password are required" }, { status: 400 })
    }

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 })
    }
    const mobileNorm = normalizeIndianMobile(phone)
    if (!mobileNorm) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit Indian mobile number" },
        { status: 400 },
      )
    }

    if (!billingState || typeof billingState !== "string" || !isValidIndianStateCode(billingState)) {
      return NextResponse.json({ error: "State is required (select from the list)" }, { status: 400 })
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
      name,
      phone: mobileNorm,
      billingState: billingState.trim().toUpperCase(),
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
