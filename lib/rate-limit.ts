/**
 * lib/rate-limit.ts
 * In-memory + Redis-backed rate limiter for sensitive endpoints.
 * Falls back gracefully to DB-only mode when Redis is not configured.
 */
import { redis } from "@/lib/redis"

// Simple in-process fallback when Redis is unavailable.
// Resets on server restart — acceptable for auth endpoints as a best-effort guard.
const inMemoryStore = new Map<string, { count: number; resetAt: number }>()

function inMemoryRateLimit(key: string, max: number, windowSec: number): boolean {
  const now = Date.now()
  const entry = inMemoryStore.get(key)
  if (!entry || entry.resetAt < now) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowSec * 1000 })
    return true // allowed
  }
  entry.count++
  if (entry.count > max) return false // blocked
  return true
}

/**
 * Check whether a request should be allowed.
 * Returns `true` if allowed, `false` if rate-limited.
 *
 * @param key    Unique key (e.g. `login:192.168.1.1`)
 * @param max    Max requests in the window
 * @param windowSec  Window duration in seconds
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowSec: number,
): Promise<boolean> {
  if (!redis) {
    return inMemoryRateLimit(key, max, windowSec)
  }
  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, windowSec)
    return count <= max
  } catch {
    // Redis error — fall back to in-memory
    return inMemoryRateLimit(key, max, windowSec)
  }
}

/** Extract a best-effort IP from common proxy headers. */
export function extractIp(request: Request): string {
  const fwd = (request as any).headers?.get?.("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]!.trim()
  const real = (request as any).headers?.get?.("x-real-ip")
  if (real) return real.trim()
  return "unknown"
}
