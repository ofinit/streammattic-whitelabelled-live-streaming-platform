import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { performWalletAdjustment } from "@/lib/wallet-adjust"

export async function POST(req: Request) {
  try {
    const adminUser = await requireRole(["admin"])
    const body = await req.json()
    const { userId, type, amount, reason, category, notes } = body

    if (!userId || !type || amount === undefined || amount === null || !reason || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 })
    }

    const valueInPaise = Math.round(Math.abs(numericAmount) * 100)

    const result = await performWalletAdjustment({
      adminUserId: adminUser.id,
      targetUserId: userId,
      type,
      amountInPaise: valueInPaise,
      category,
      reason,
      notes,
    })

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      balance: result.balanceAfter,
      message: "Adjustment successful",
    })
  } catch (error: any) {
    console.error("Admin Wallet Adjust API error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    await requireRole(["admin"])
    const sql = getDb()

    // Join with users for target and initiator names
    const rows = await sql`
      SELECT 
        wa.*,
        u_target.name as target_user_name,
        u_target.role as target_user_role,
        u_target.email as target_user_email,
        u_init.name as initiator_name
      FROM wallet_adjustments wa
      JOIN users u_target ON wa.target_user_id = u_target.id
      JOIN users u_init ON wa.initiated_by = u_init.id
      ORDER BY wa.created_at DESC
    `

    const { toCamelRows } = require("@/lib/db")
    return NextResponse.json({ data: toCamelRows(rows as Record<string, unknown>[]) })
  } catch (error: any) {
    console.error("Admin Wallet Adjust GET API error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
