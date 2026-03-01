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

  // Check wallet balance
  const wallets = await sql`SELECT * FROM wallets WHERE user_id = ${userId}`
  if (wallets.length === 0) return jsonError("Wallet not found", 404)
  const wallet = wallets[0] as Record<string, unknown>
  const balance = wallet.balance as number

  if (balance < totalPrice) return jsonError("Insufficient wallet balance", 400)

  // Debit wallet
  const newBalance = balance - totalPrice
  await sql`UPDATE wallets SET balance = ${newBalance}, updated_at = NOW() WHERE id = ${wallet.id}`

  // Create wallet transaction
  const txn = await sql`
    INSERT INTO wallet_transactions (wallet_id, user_id, type, category, amount, balance_before, balance_after, description)
    VALUES (${wallet.id}, ${userId}, 'debit', 'credit_purchase', ${totalPrice}, ${balance}, ${newBalance}, ${`Purchased ${quantity} ${streamType} credits`})
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
