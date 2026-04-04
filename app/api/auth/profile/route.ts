import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { firstName, lastName, phone } = body

    if (!firstName || typeof firstName !== "string") {
      return NextResponse.json({ error: "First name is required" }, { status: 400 })
    }

    const fullName = [firstName.trim(), lastName?.trim()].filter(Boolean).join(" ")
    const phoneVal = phone?.trim() || null

    const sql = getDb()
    await sql`
      UPDATE users 
      SET 
        name = ${fullName}, 
        phone = ${phoneVal},
        updated_at = NOW()
      WHERE id = ${user.id}
    `

    return NextResponse.json({ success: true, name: fullName, phone: phoneVal })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
