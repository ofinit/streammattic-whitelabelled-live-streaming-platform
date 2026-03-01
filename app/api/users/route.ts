import { NextRequest } from "next/server"
import { getDb, toCamelRows } from "@/lib/db"
import { jsonOk, jsonError, withRole } from "@/lib/api-helpers"
import { createUser } from "@/lib/auth"

export const GET = withRole(["admin"], async (user, request) => {
  const url = new URL(request.url)
  const role = url.searchParams.get("role")
  const status = url.searchParams.get("status")
  const search = url.searchParams.get("search")
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "50")
  const offset = (page - 1) * limit

  const sql = getDb()

  let query = "SELECT id, email, name, phone, role, status, avatar, email_verified, last_login_at, created_at, updated_at FROM users WHERE 1=1"
  const params: unknown[] = []
  let paramIndex = 1

  if (role) { query += ` AND role = $${paramIndex++}`; params.push(role) }
  if (status) { query += ` AND status = $${paramIndex++}`; params.push(status) }
  if (search) { query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex++})`; params.push(`%${search}%`) }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
  params.push(limit, offset)

  // Use tagged template for simple queries
  const rows = role && !status && !search
    ? await sql`SELECT id, email, name, phone, role, status, avatar, email_verified, last_login_at, created_at, updated_at FROM users WHERE role = ${role} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
    : await sql`SELECT id, email, name, phone, role, status, avatar, email_verified, last_login_at, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`

  const countRows = await sql`SELECT count(*)::int as total FROM users`
  const total = (countRows[0] as Record<string, unknown>).total as number

  return jsonOk({ users: toCamelRows(rows as Record<string, unknown>[]), total, page, limit })
})

export const POST = withRole(["admin"], async (adminUser, request) => {
  const body = await (request as Request).json()
  const { email, password, name, phone, role } = body

  if (!email || !password || !name) {
    return jsonError("Email, password, and name are required")
  }

  const sql = getDb()
  const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()}`
  if (existing.length > 0) {
    return jsonError("Email already exists", 409)
  }

  const user = await createUser({
    email: email.toLowerCase().trim(),
    password,
    name,
    phone,
    role: role || "streamer",
  })

  return jsonOk({ user }, 201)
})
