import { getDb, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"
import { getBestPriceForQuantity, isStreamTypeKey, parseStreamTypePricing } from "@/lib/stream-type-pricing"

const CREDIT_COLUMN: Record<string, string> = {
  rtmp: "rtmp",
  youtube_api: "youtube_api",
  youtube_embed: "youtube_embed",
  third_party: "third_party",
}

export const POST = withAuth(async (user, request) => {
  const body = await request.json()
  const { streamType, quantity } = body

  if (!streamType || !quantity || quantity < 1) {
    return jsonError("streamType and quantity are required")
  }

  if (!isStreamTypeKey(streamType)) {
    return jsonError("Invalid stream type", 400)
  }

  const sql = getDb()
  const userId = user.id as string

  const streamRows = await sql`SELECT value FROM platform_settings WHERE key = 'stream_type_pricing'`
  const volumeRows = await sql`SELECT value FROM platform_settings WHERE key = 'volume_discount_tiers'`
  const streamRaw = streamRows.length > 0 ? (streamRows[0] as Record<string, unknown>).value : null
  const volumeRaw = volumeRows.length > 0 ? (volumeRows[0] as Record<string, unknown>).value : null

  const streamTypePricing = parseStreamTypePricing(streamRaw, volumeRaw)
  const config = streamTypePricing[streamType]
  if (!config?.enabled) {
    return jsonError("This stream type is not available for purchase", 400)
  }

  const { pricePerEvent, tierLabel, totalPrice } = getBestPriceForQuantity(streamType, quantity, streamTypePricing)

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

  const desc =
    tierLabel != null && tierLabel !== ""
      ? `Purchased ${quantity} ${streamType} credits (${tierLabel})`
      : `Purchased ${quantity} ${streamType} credits`

  const txn = await sql`
    INSERT INTO wallet_transactions (wallet_id, user_id, type, category, amount, balance_before, balance_after, description)
    VALUES (${wallet.id}, ${userId}, 'debit', 'credit_purchase', ${totalPrice}, ${oldBalance}, ${newBalance}, ${desc})
    RETURNING *
  `

  const txnId = (txn[0] as Record<string, unknown>).id

  await sql`
    INSERT INTO credit_purchases (user_id, stream_type, quantity, price_per_credit, total_price, discount_tier_label, wallet_transaction_id)
    VALUES (${userId}, ${streamType}, ${quantity}, ${pricePerEvent}, ${totalPrice}, ${tierLabel ?? null}, ${txnId})
  `

  const col = CREDIT_COLUMN[streamType]
  await sql(
    `INSERT INTO user_credits (user_id, ${col}) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET ${col} = user_credits.${col} + EXCLUDED.${col}, updated_at = NOW()`,
    [userId, quantity],
  )

  const credits = await sql`SELECT * FROM user_credits WHERE user_id = ${userId}`
  return jsonOk({
    credits: toCamel((credits[0] || {}) as Record<string, unknown>),
    transaction: toCamel(txn[0] as Record<string, unknown>),
  })
})
