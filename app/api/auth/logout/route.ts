import { NextResponse } from "next/server"
import { getSessionCookie, deleteSession, clearSessionCookie } from "@/lib/auth"

export async function POST() {
  try {
    const token = await getSessionCookie()
    if (token) {
      await deleteSession(token)
    }
    await clearSessionCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    // Even if DB delete fails, clear the cookie
    await clearSessionCookie()
    return NextResponse.json({ success: true })
  }
}
