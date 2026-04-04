import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(req: Request) {
  try {
    await requireRole(["admin"])
    
    const sql = getDb()
    
    // Fetch wallets and join user data
    const rows = await sql`
      SELECT 
        w.id as wallet_id, w.balance, w.currency, w.updated_at,
        u.id as user_id, u.name as user_name, u.email as user_email, u.role as user_role, u.status as user_status
      FROM wallets w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.updated_at DESC
    `

    // Output formatted to expected UI model
    const wallets = rows.map(r => ({
      id: r.wallet_id,
      userId: r.user_id,
      userName: r.user_name,
      userRole: r.user_role,
      userEmail: r.user_email,
      userStatus: r.user_status,
      balance: Number(r.balance) || 0,
      currency: r.currency,
      lastUpdated: r.updated_at
    }))

    return NextResponse.json({ success: true, wallets })
  } catch (error: any) {
    console.error("Admin Wallets API error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
