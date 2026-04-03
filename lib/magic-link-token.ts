import { createHmac, timingSafeEqual } from "crypto"

const SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || ""

const TTL_MS = 15 * 60 * 1000 // 15 minutes

export function createMagicLinkToken(email: string, sessionId: string): string {
  const payload = JSON.stringify({
    email: email.toLowerCase().trim(),
    sessionId,
    exp: Date.now() + TTL_MS,
  })
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url")
  const sig = createHmac("sha256", SECRET).update(payloadB64).digest("base64url")
  return `${payloadB64}.${sig}`
}

export function verifyMagicLinkToken(token: string): { email: string; sessionId: string } | null {
  try {
    const [payloadB64, sig] = token.split(".")
    if (!payloadB64 || !sig) return null
    const expected = createHmac("sha256", SECRET).update(payloadB64).digest("base64url")
    if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"))
    if (!payload.email || !payload.sessionId || !payload.exp || Date.now() > payload.exp) return null
    return { email: payload.email, sessionId: payload.sessionId }
  } catch {
    return null
  }
}
