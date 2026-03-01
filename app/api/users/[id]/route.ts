import { getDb, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"

export const GET = withAuth(async (authUser, request) => {
  const url = new URL(request.url)
  const id = url.pathname.split("/").pop()!
  const sql = getDb()

  // Users can only view their own profile unless they're admin
  if (authUser.role !== "admin" && authUser.id !== id) {
    return jsonError("Forbidden", 403)
  }

  const rows = await sql`
    SELECT id, email, name, phone, role, status, avatar, email_verified, last_login_at, created_at, updated_at
    FROM users WHERE id = ${id}
  `
  if (rows.length === 0) return jsonError("User not found", 404)
  return jsonOk({ user: toCamel(rows[0] as Record<string, unknown>) })
})

export const PUT = withAuth(async (authUser, request) => {
  const url = new URL(request.url)
  const id = url.pathname.split("/").pop()!
  const body = await request.json()
  const sql = getDb()

  // Only admin can update other users; users can update themselves
  if (authUser.role !== "admin" && authUser.id !== id) {
    return jsonError("Forbidden", 403)
  }

  const { name, phone, status, role, avatar } = body

  // Only admin can change role/status
  if ((status || role) && authUser.role !== "admin") {
    return jsonError("Only admin can change role or status", 403)
  }

  const rows = await sql`
    UPDATE users SET
      name = COALESCE(${name ?? null}, name),
      phone = COALESCE(${phone ?? null}, phone),
      status = COALESCE(${status ?? null}, status),
      role = COALESCE(${role ?? null}, role),
      avatar = COALESCE(${avatar ?? null}, avatar),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, email, name, phone, role, status, avatar, email_verified, created_at, updated_at
  `
  if (rows.length === 0) return jsonError("User not found", 404)
  return jsonOk({ user: toCamel(rows[0] as Record<string, unknown>) })
})
