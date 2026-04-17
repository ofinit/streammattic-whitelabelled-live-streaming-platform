import { NextResponse } from "next/server"
import { getCurrentUser } from "./auth"

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
      const user = await getCurrentUser()
      if (!user) return jsonError("Unauthorized", 401)
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
      const user = await getCurrentUser()
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
