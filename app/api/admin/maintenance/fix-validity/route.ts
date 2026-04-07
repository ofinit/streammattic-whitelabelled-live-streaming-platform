import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function POST() {
  try {
    await requireRole(["admin"])
    
    const sql = getDb()
    
    // Backfill any null validity_expires_at based on creation date
    const result = await sql`
      UPDATE events 
      SET validity_expires_at = created_at + INTERVAL '30 days'
      WHERE validity_expires_at IS NULL
      RETURNING id
    `
    
    return NextResponse.json({ 
      success: true, 
      count: result.length,
      message: `Successfully backfilled ${result.length} event validity dates.` 
    })
  } catch (error: any) {
    console.error("Maintenance API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
