import { NextResponse } from "next/server"
import { getCurrentUser } from "./auth"
import { getDb, toCamel } from "./db"

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/** Wraps a route handler with auth check. Passes user to the handler. */
export function withAuth(
  handler: (user: Record<string, unknown>, request: Request) => Promise<NextResponse>
) {
  return async (request: Request) => {
    try {
      let user = await getCurrentUser()
      if (!user) return jsonError("Unauthorized", 401)

      // Support Admin Impersonation without modifying session cookies:
      // If the authenticated session is an admin and an impersonation header is passed,
      // load the target user's profile for the request handler.
      if (user.role === "admin") {
        const impersonateId = request.headers.get("x-impersonate-user-id")
        if (impersonateId && impersonateId !== user.id) {
          const sql = getDb()
          const rows = await sql`
            SELECT id, email, name, phone, role, status, avatar, theme_preference, email_verified, created_at, updated_at, studio_subscription_expires_at
            FROM users WHERE id = ${impersonateId}
          `
          if (rows.length > 0) {
            user = toCamel(rows[0] as Record<string, unknown>)
          }
        }
      }

      // Must await: otherwise handler rejections (e.g. DB errors) become unhandled and surface as opaque 500s.
      return await handler(user as Record<string, unknown>, request)
    } catch (e) {
      console.error("[withAuth]", e)
      return jsonError("Internal server error", 500)
    }
  }
}

/** Wraps a route handler but doesn't throw 401 if user is not signed in. */
export function withOptionalAuth(
  handler: (user: Record<string, unknown> | null, request: Request) => Promise<NextResponse>
) {
  return async (request: Request) => {
    try {
      let user = await getCurrentUser()
      if (user?.role === "admin") {
        const impersonateId = request.headers.get("x-impersonate-user-id")
        if (impersonateId && impersonateId !== user.id) {
          const sql = getDb()
          const rows = await sql`
            SELECT id, email, name, phone, role, status, avatar, theme_preference, email_verified, created_at, updated_at, studio_subscription_expires_at
            FROM users WHERE id = ${impersonateId}
          `
          if (rows.length > 0) {
            user = toCamel(rows[0] as Record<string, unknown>)
          }
        }
      }
      return await handler(user as Record<string, unknown> | null, request)
    } catch (e) {
      console.error("[withOptionalAuth]", e)
      try {
        return await handler(null, request)
      } catch (e2) {
        console.error("[withOptionalAuth] fallback handler", e2)
        return jsonError("Internal server error", 500)
      }
    }
  }
}

/** Wraps a route handler with role-based auth check. */
export function withRole(
  roles: string[],
  handler: (user: Record<string, unknown>, request: Request) => Promise<NextResponse>
) {
  return withAuth(async (user, request) => {
    if (!roles.includes(user.role as string)) {
      return jsonError("Forbidden", 403)
    }
    return handler(user, request)
  })
}
