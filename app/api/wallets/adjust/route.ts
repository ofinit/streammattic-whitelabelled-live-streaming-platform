import { getDb, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withRole } from "@/lib/api-helpers"

export const POST = withRole(["admin"], async (adminUser, request) => {
  const body = await request.json()
  const { userId, amount, type, category, reason, notes } = body

  if (!userId || !amount || !type || !category) {
    return jsonError("userId, amount, type, and category are required")
  }

  const sql = getDb()

  // Get wallet
  const wallets = await sql`SELECT * FROM wallets WHERE user_id = ${userId}`
  if (wallets.length === 0) return jsonError("Wallet not found", 404)

  const wallet = wallets[0] as Record<string, unknown>
  const currentBalance = wallet.balance as number
  const amountInPaise = Math.round(amount * 100) // Convert to paise

  const newBalance = type === "credit"
    ? currentBalance + amountInPaise
    : currentBalance - amountInPaise

  if (newBalance < 0) return jsonError("Insufficient balance for debit", 400)

  // Update wallet balance
  await sql`UPDATE wallets SET balance = ${newBalance}, updated_at = NOW() WHERE id = ${wallet.id}`

  // Create transaction record
  const txnRows = await sql`
    INSERT INTO wallet_transactions (wallet_id, user_id, type, category, amount, balance_before, balance_after, description, performed_by, reason, notes)
    VALUES (${wallet.id}, ${userId}, ${type}, ${category}, ${amountInPaise}, ${currentBalance}, ${newBalance}, ${reason || `Manual ${type} by admin`}, ${adminUser.id}, ${reason || null}, ${notes || null})
    RETURNING *
  `

  return jsonOk({ transaction: toCamel(txnRows[0] as Record<string, unknown>), newBalance })
})
