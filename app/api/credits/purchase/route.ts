import { getDb, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"

export const POST = withAuth(async (user, request) => {
  const body = await request.json()
  const { streamType, quantity } = body

  if (!streamType || !quantity || quantity < 1) {
    return jsonError("streamType and quantity are required")
  }

  const sql = getDb()
  const userId = user.id as string

  // Get pricing from platform settings
  const pricingRows = await sql`SELECT value FROM platform_settings WHERE key = 'credit_pricing'`
  if (pricingRows.length === 0) return jsonError("Pricing not configured", 500)
  const pricing = (pricingRows[0] as Record<string, unknown>).value as Record<string, number>
  const pricePerCredit = pricing[streamType]
  if (!pricePerCredit) return jsonError("Invalid stream type", 400)

  const totalPrice = pricePerCredit * quantity * 100 // Convert to paise

  // Atomically debit wallet to prevent race conditions
  const updatedWallets = await sql`
    UPDATE wallets 
    SET balance = balance - ${totalPrice}, updated_at = NOW() 
    WHERE user_id = ${userId} AND balance >= ${totalPrice}
    RETURNING id, balance as new_balance, balance + ${totalPrice} as old_balance
  `

  if (updatedWallets.length === 0) {
    return jsonError("Insufficient wallet balance or wallet not found", 400)
  }

  const wallet = updatedWallets[0] as Record<string, unknown>
  const newBalance = wallet.new_balance as number
  const oldBalance = wallet.old_balance as number

  // Create wallet transaction
  const txn = await sql`
    INSERT INTO wallet_transactions (wallet_id, user_id, type, category, amount, balance_before, balance_after, description)
    VALUES (${wallet.id}, ${userId}, 'debit', 'credit_purchase', ${totalPrice}, ${oldBalance}, ${newBalance}, ${`Purchased ${quantity} ${streamType} credits`})
    RETURNING *
  `

  // Create credit purchase record
  await sql`
    INSERT INTO credit_purchases (user_id, stream_type, quantity, price_per_credit, total_price, wallet_transaction_id)
    VALUES (${userId}, ${streamType}, ${quantity}, ${pricePerCredit * 100}, ${totalPrice}, ${(txn[0] as Record<string, unknown>).id})
  `

  // Update user credits
  const creditCol = streamType === "rtmp" ? "rtmp" : streamType === "youtube_api" ? "youtube_api" : streamType === "youtube_embed" ? "youtube_embed" : "third_party"
  await sql`
    UPDATE user_credits
    SET ${sql.unsafe(creditCol)} = ${sql.unsafe(creditCol)} + ${quantity}, updated_at = NOW()
    WHERE user_id = ${userId}
  `

  // Fetch updated credits
  const credits = await sql`SELECT * FROM user_credits WHERE user_id = ${userId}`
  return jsonOk({ credits: toCamel(credits[0] as Record<string, unknown>), transaction: toCamel(txn[0] as Record<string, unknown>) })
})
