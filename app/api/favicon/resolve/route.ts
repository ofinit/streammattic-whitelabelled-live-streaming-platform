import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { resolveFaviconForSession } from "@/lib/favicon-resolve"

/** Public + optional session: platform → studio (studio/streamer) → default red play icon */
export async function GET() {
  try {
    const user = await getCurrentUser()
    const href = await resolveFaviconForSession(
      user ? { id: user.id as string, role: user.role as string | undefined } : null,
    )
    return NextResponse.json({ href })
  } catch (e) {
    console.error("[favicon/resolve]", e)
    return NextResponse.json({ href: "/favicon-live-red.svg" })
  }
}
