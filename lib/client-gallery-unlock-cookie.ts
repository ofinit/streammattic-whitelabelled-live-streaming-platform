import { createHmac, timingSafeEqual } from "crypto"

const COOKIE_NAME = "cg_album_unlock"

function unlockSecret(): string {
  return (
    process.env.CLIENT_GALLERY_UNLOCK_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "dev-client-gallery-unlock-change-me"
  )
}

/** Signed payload: base64url(json).hmac — binds public_token and expiry (no PIN stored). */
export function signGalleryUnlockCookie(publicToken: string): string {
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000
  const payload = Buffer.from(JSON.stringify({ t: publicToken, exp }), "utf8").toString("base64url")
  const sig = createHmac("sha256", unlockSecret()).update(payload).digest("base64url")
  return `${payload}.${sig}`
}

export function verifyGalleryUnlockCookie(cookieValue: string | undefined, publicToken: string): boolean {
  if (!cookieValue || typeof cookieValue !== "string") return false
  const lastDot = cookieValue.lastIndexOf(".")
  if (lastDot <= 0) return false
  const payload = cookieValue.slice(0, lastDot)
  const sig = cookieValue.slice(lastDot + 1)
  const expected = createHmac("sha256", unlockSecret()).update(payload).digest("base64url")
  try {
    const a = Buffer.from(sig, "utf8")
    const b = Buffer.from(expected, "utf8")
    if (a.length !== b.length) return false
    if (!timingSafeEqual(a, b)) return false
  } catch {
    return false
  }
  try {
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { t?: string; exp?: number }
    if (json.t !== publicToken) return false
    if (typeof json.exp !== "number" || json.exp < Date.now()) return false
    return true
  } catch {
    return false
  }
}

export const GALLERY_UNLOCK_COOKIE_NAME = COOKIE_NAME

/** Path scoped so the cookie is only sent to public gallery routes. */
export const GALLERY_UNLOCK_COOKIE_PATH = "/client-gallery/v"
