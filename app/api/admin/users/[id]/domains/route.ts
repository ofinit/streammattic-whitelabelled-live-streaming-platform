import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb, toCamelRows } from "@/lib/db"

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

    const sql = getDb()
    
    // Check if domain exists
    const existing = await sql`SELECT id FROM domains WHERE domain = ${domain.toLowerCase()}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "Domain already registered" }, { status: 400 })
    }

    const verificationToken = `streamlivee-verify-${Math.random().toString(36).substring(2, 15)}`
    
    const [inserted] = await sql`
      INSERT INTO domains (user_id, domain, verification_token, is_primary)
      VALUES (${userId}, ${domain.toLowerCase()}, ${verificationToken}, true)
      ON CONFLICT (user_id, is_primary) WHERE (is_primary = true) 
      DO UPDATE SET domain = EXCLUDED.domain, verification_token = EXCLUDED.verification_token, updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json({ success: true, domain: inserted })
  } catch (error: any) {
    console.error("Admin User Domains POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
