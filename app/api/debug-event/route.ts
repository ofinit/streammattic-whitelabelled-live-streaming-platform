import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT id, title, slug, crew_pin_hash, user_id, studio_id 
      FROM events 
      WHERE slug = 'alekhya-weds-srikanth-rao'
    `
    return NextResponse.json({ success: true, rows })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message })
  }
}
