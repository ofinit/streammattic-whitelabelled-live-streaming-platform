import { timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { jsonError } from "@/lib/api-helpers"
import {
  GALLERY_UNLOCK_COOKIE_NAME,
  GALLERY_UNLOCK_COOKIE_PATH,
  signGalleryUnlockCookie,
} from "@/lib/client-gallery-unlock-cookie"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params
  const raw = token ? decodeURIComponent(token) : ""
  if (!raw) {
    return jsonError("Invalid token", 400)
  }

  let body: { pin?: unknown }
  try {
    body = (await request.json()) as { pin?: unknown }
  } catch {
    return jsonError("Invalid JSON body", 400)
  }
  const pinIn = typeof body.pin === "string" ? body.pin.trim().replace(/\s+/g, "") : ""
  if (!/^\d{4,12}$/.test(pinIn)) {
    return jsonError("Enter a valid PIN", 400)
  }

  const sql = getDb()
  let row: { guest_pin_required?: boolean; guest_pin?: string | null } | undefined
  try {
    const rows = await sql`
      SELECT guest_pin_required, guest_pin
      FROM client_gallery_albums
      WHERE public_token = ${raw}
      LIMIT 1
    `
    row = rows[0] as { guest_pin_required?: boolean; guest_pin?: string | null } | undefined
  } catch (e) {
    const code = (e as { code?: string })?.code
    if (code === "42703") {
      return jsonError("Gallery not available", 503)
    }
    throw e
  }

  if (!row || !row.guest_pin_required) {
    return jsonError("PIN is not required for this gallery", 400)
  }

  const stored = row.guest_pin != null ? String(row.guest_pin).trim() : ""
  if (!stored || stored.length === 0) {
    return jsonError("PIN not configured", 503)
  }

  const a = Buffer.from(pinIn, "utf8")
  const b = Buffer.from(stored, "utf8")
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return jsonError("Incorrect PIN", 401)
  }

  const signed = signGalleryUnlockCookie(raw)
  const out = NextResponse.json({ ok: true }, { status: 200 })
  out.cookies.set(GALLERY_UNLOCK_COOKIE_NAME, signed, {
    httpOnly: true,
    path: GALLERY_UNLOCK_COOKIE_PATH,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60,
  })
  return out
}
