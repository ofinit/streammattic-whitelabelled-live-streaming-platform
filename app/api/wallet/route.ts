import { NextResponse } from "next/server"
import { withAuth } from "@/lib/api-helpers"
import { getDb } from "@/lib/db"

export const GET = withAuth(async (user, _request) => {
  const sql = getDb()
  const userId = user.id as string

  // Fetch wallet
  const walletRows = await sql`
    SELECT * FROM wallets WHERE user_id = ${userId}
  `
  if (walletRows.length === 0) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
  }
  const wallet = walletRows[0]

  // Fetch summary stats (current month)
  const stats = await sql`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as monthly_credits,
      COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as monthly_debits
    FROM wallet_transactions
    WHERE user_id = ${userId}
      AND created_at >= date_trunc('month', now())
  `

  // Fetch transactions
  const transactionRows = await sql`
    SELECT * FROM wallet_transactions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 100
  `

  return NextResponse.json({
    success: true,
    wallet: {
      id: wallet.id,
      balance: Number(wallet.balance) || 0,
      currency: wallet.currency || "INR",
      updatedAt: wallet.updated_at
    },
    summary: {
      monthlyCredits: Number(stats[0]?.monthly_credits || 0),
      monthlyDebits: Number(stats[0]?.monthly_debits || 0)
    },
    transactions: transactionRows.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      currency: t.currency,
      category: t.category,
      reason: t.reason,
      status: t.status,
      createdAt: t.created_at
    }))
  })
})
