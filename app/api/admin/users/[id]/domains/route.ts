import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb, toCamelRows } from "@/lib/db"
import { isValidHostname } from "@/lib/studio-setup-validation"

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"])
    const { id: userId } = await props.params

    const sql = getDb()
    const rows = await sql`SELECT * FROM domains WHERE user_id = ${userId} ORDER BY is_primary DESC, created_at DESC`
    const domains = toCamelRows(rows as Record<string, unknown>[])

    return NextResponse.json({ success: true, domains })
  } catch (error: any) {
    console.error("Admin User Domains GET error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"])
    const { id: userId } = await props.params
    const { domain } = await req.json()

    if (!domain) return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    const normalizedDomain = String(domain)
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
    if (!isValidHostname(normalizedDomain)) {
      return NextResponse.json({ error: "Enter a valid domain without https:// or a path" }, { status: 400 })
    }

    const sql = getDb()

    const existing = await sql`
      SELECT id, user_id
      FROM domains
      WHERE domain = ${normalizedDomain}
      LIMIT 1
    `
    const existingDomain = existing[0] as Record<string, unknown> | undefined
    if (existingDomain && String(existingDomain.user_id) !== userId) {
      return NextResponse.json({ error: "Domain already registered" }, { status: 400 })
    }

    const verificationToken = `streamlivee-verify-${Math.random().toString(36).substring(2, 15)}`

    let saved: unknown
    if (existingDomain) {
      const rows = await sql`
        UPDATE domains
        SET verification_token = ${verificationToken},
            verification_status = 'pending',
            ssl_status = 'pending',
            is_primary = true
        WHERE id = ${existingDomain.id}
        RETURNING *
      `
      saved = rows[0]
    } else {
      const primaryRows = await sql`
        SELECT id
        FROM domains
        WHERE user_id = ${userId} AND is_primary = true
        ORDER BY created_at DESC
        LIMIT 1
      `
      const primary = primaryRows[0] as Record<string, unknown> | undefined
      if (primary) {
        const rows = await sql`
          UPDATE domains
          SET domain = ${normalizedDomain},
              verification_token = ${verificationToken},
              verification_status = 'pending',
              ssl_status = 'pending',
              is_primary = true
          WHERE id = ${primary.id}
          RETURNING *
        `
        saved = rows[0]
      } else {
        const rows = await sql`
          INSERT INTO domains (user_id, domain, verification_token, verification_status, ssl_status, is_primary)
          VALUES (${userId}, ${normalizedDomain}, ${verificationToken}, 'pending', 'pending', true)
          RETURNING *
        `
        saved = rows[0]
      }
    }

    await sql`
      UPDATE domains
      SET is_primary = false
      WHERE user_id = ${userId}
        AND id <> ${(saved as Record<string, unknown>).id}
    `

    return NextResponse.json({
      success: true,
      domain: toCamelRows([saved as Record<string, unknown>])[0],
    })
  } catch (error: any) {
    console.error("Admin User Domains POST error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
