import { jsonOk, jsonError, withRole } from "@/lib/api-helpers"
import { performWalletAdjustment } from "@/lib/wallet-adjust"

export const POST = withRole(["admin"], async (adminUser, request) => {
  const body = await request.json()
  const { userId, amount, type, category, reason, notes } = body

  if (!userId || amount === undefined || amount === null || !type || !category) {
    return jsonError("userId, amount, type, and category are required")
  }

  const numericAmount = Number(amount)
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return jsonError("amount must be a positive number", 400)
  }

  const amountInPaise = Math.round(numericAmount * 100)

  const result = await performWalletAdjustment({
    adminUserId: adminUser.id as string,
    targetUserId: userId,
    type,
    amountInPaise,
    category,
    reason: reason || `Manual ${type} by admin`,
    notes: notes || null,
  })

  if ("error" in result) {
    return jsonError(result.error, result.status)
  }

  return jsonOk({
    transaction: result.transaction,
    newBalance: result.balanceAfter,
  })
})
