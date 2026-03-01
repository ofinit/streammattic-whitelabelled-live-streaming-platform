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
      return handler(user as Record<string, unknown>, request)
    } catch {
      return jsonError("Unauthorized", 401)
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
