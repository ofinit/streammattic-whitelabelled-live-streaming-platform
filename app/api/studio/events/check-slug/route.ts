import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * GET /api/studio/events/check-slug?slug=my-event&excludeId=uuid
 * Returns { available: boolean, error?: string }
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? ""
  const excludeId = req.nextUrl.searchParams.get("excludeId") ?? null

  if (!slug) {
    return NextResponse.json({ available: false, error: "Slug is required" })
  }
  if (slug.length < 3) {
    return NextResponse.json({ available: false, error: "Slug must be at least 3 characters" })
  }
  if (slug.length > 80) {
    return NextResponse.json({ available: false, error: "Slug must be 80 characters or less" })
  }
  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json({
      available: false,
      error: "Only lowercase letters, numbers and hyphens allowed (no leading/trailing hyphens)",
    })
  }

  try {
    const sql = getDb()
    const rows = excludeId
      ? await sql`SELECT id FROM events WHERE slug = ${slug} AND id != ${excludeId}`
      : await sql`SELECT id FROM events WHERE slug = ${slug}`

    return NextResponse.json({ available: rows.length === 0 })
  } catch (error) {
    console.error("[check-slug] Error:", error)
    return NextResponse.json({ available: false, error: "Could not verify slug" }, { status: 500 })
  }
}
