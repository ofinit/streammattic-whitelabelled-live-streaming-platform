import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const adminUser = await requireRole(["admin"])
    const { userId, type, amount, reason, category } = await req.json()

    if (!userId || !type || !amount || !reason || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["credit", "debit"].includes(type)) {
      return NextResponse.json({ error: "Type must be credit or debit" }, { status: 400 })
    }

    const value = Math.abs(parseInt(amount, 10))
    if (isNaN(value) || value <= 0) {
      return NextResponse.json({ error: "Amount must be a positive integer" }, { status: 400 })
    }

    const sql = getDb()

    // Process safely inside a transaction hook
    // Neon Serverless package doesn't have a formal BEGIN/COMMIT, we use the connection
    const targetWalletQuery = await sql`SELECT id, balance FROM wallets WHERE user_id = ${userId}`
    if (targetWalletQuery.length === 0) {
      return NextResponse.json({ error: "Target user wallet not found" }, { status: 404 })
    }

    const wallet = targetWalletQuery[0]
    const balanceBefore = Number(wallet.balance)
    let balanceAfter = balanceBefore

    if (type === "credit") {
      balanceAfter += value
    } else {
      balanceAfter -= value
      if (balanceAfter < 0) balanceAfter = 0 // prevent negative balance from manual adjustment
    }

    // Insert the actual transaction
    const wtxn = await sql`
      INSERT INTO wallet_transactions 
        (wallet_id, user_id, type, category, amount, balance_before, balance_after, description, performed_by, reason)
      VALUES 
        (${wallet.id}, ${userId}, ${type}, ${category}, ${value}, ${balanceBefore}, ${balanceAfter}, 'Manual Administrator Adjustment', ${adminUser.id}, ${reason})
      RETURNING id
    `
    const transactionId = wtxn[0].id

    // Log the formal adjustment 
    await sql`
      INSERT INTO wallet_adjustments
        (target_user_id, type, amount, reason, category, initiated_by, status, transaction_id)
      VALUES
        (${userId}, ${type}, ${value}, ${reason}, ${category}, ${adminUser.id}, 'completed', ${transactionId})
    `

    // Update wallet balance
    await sql`
      UPDATE wallets SET balance = ${balanceAfter}, updated_at = NOW() WHERE id = ${wallet.id}
    `

    return NextResponse.json({ success: true, balance: balanceAfter, message: "Adjustment successful" })
  } catch (error: any) {
    console.error("Admin Wallet Adjust API error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
