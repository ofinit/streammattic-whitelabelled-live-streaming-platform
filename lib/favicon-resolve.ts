import { getDb, toCamel } from "@/lib/db"
import { getPlatformSetting } from "@/lib/db-queries"

/** Default: red tile + white play (live) */
export const DEFAULT_FAVICON_PATH = "/favicon-live-red.svg"

function normalizeFaviconValue(val: unknown): string | null {
  if (val == null) return null
  if (typeof val === "string" && val.trim()) return val.trim()
  if (typeof val === "object" && val !== null && "url" in val && typeof (val as { url: unknown }).url === "string") {
    const u = (val as { url: string }).url.trim()
    return u || null
  }
  return null
}

export async function getPlatformFaviconUrl(): Promise<string | null> {
  const raw = await getPlatformSetting("platform_favicon_url")
  return normalizeFaviconValue(raw)
}

/** studio_branding favicon (supports favicon / favicon_url columns via toCamel). */
export async function getStudioFaviconByUserId(studioUserId: string): Promise<string | null> {
  if (!studioUserId) return null
  try {
    const sql = getDb()
    const rows = await sql`SELECT * FROM studio_branding WHERE user_id = ${studioUserId} LIMIT 1`
    if (rows.length === 0) return null
    const c = toCamel(rows[0] as Record<string, unknown>) as { favicon?: string; faviconUrl?: string }
    return (c.faviconUrl || c.favicon || "").trim() || null
  } catch {
    return null
  }
}

/**
 * Studio user id for branding: event owner if studio, else streamer's parent studio when `parent_id` exists.
 */
export async function resolveStudioUserIdForEventOwner(eventOwnerUserId: string): Promise<string | null> {
  if (!eventOwnerUserId) return null
  const sql = getDb()
  try {
    const rows = await sql`SELECT id, role FROM users WHERE id = ${eventOwnerUserId} LIMIT 1`
    if (rows.length === 0) return null
    const row = rows[0] as Record<string, unknown>
    const role = String(row.role || "")
    if (role === "studio") return String(row.id)

    if (role === "streamer") {
      try {
        const pr = await sql`SELECT parent_id FROM users WHERE id = ${eventOwnerUserId} LIMIT 1`
        if (pr.length > 0) {
          const pid = (pr[0] as Record<string, unknown>).parent_id
          if (pid != null && String(pid).length > 0) return String(pid)
        }
      } catch {
        /* parent_id column may not exist */
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Public watch / event pages: admin platform favicon wins, else studio for event, else default.
 */
export async function resolveFaviconForWatchEvent(eventOwnerUserId: string | null | undefined): Promise<string> {
  const platform = await getPlatformFaviconUrl()
  if (platform) return platform

  if (eventOwnerUserId) {
    const studioId = await resolveStudioUserIdForEventOwner(eventOwnerUserId)
    if (studioId) {
      const fav = await getStudioFaviconByUserId(studioId)
      if (fav) return fav
    }
  }

  return DEFAULT_FAVICON_PATH
}

type SessionUser = { id: string; role?: string }

/**
 * Logged-in shell: platform first, then studio branding for studio or streamer's studio.
 */
export async function resolveFaviconForSession(user: SessionUser | null): Promise<string> {
  const platform = await getPlatformFaviconUrl()
  if (platform) return platform

  if (!user?.id) return DEFAULT_FAVICON_PATH

  if (user.role === "studio") {
    const fav = await getStudioFaviconByUserId(user.id)
    return fav || DEFAULT_FAVICON_PATH
  }

  if (user.role === "streamer") {
    const studioId = await resolveStudioUserIdForEventOwner(user.id)
    if (studioId) {
      const fav = await getStudioFaviconByUserId(studioId)
      if (fav) return fav
    }
    return DEFAULT_FAVICON_PATH
  }

  return DEFAULT_FAVICON_PATH
}
