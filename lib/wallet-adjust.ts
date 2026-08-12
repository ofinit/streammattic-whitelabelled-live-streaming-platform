import { withTransaction, toCamel } from "@/lib/db"

export type PerformWalletAdjustmentInput = {
  adminUserId: string
  targetUserId: string
  type: "credit" | "debit"
  amountInPaise: number
  category: string
  reason: string
  notes?: string | null
}

export type PerformWalletAdjustmentResult =
  | {
      success: true
      transaction: Record<string, unknown>
      balanceAfter: number
    }
  | {
      error: string
      status: number
    }

export async function performWalletAdjustment(
  input: PerformWalletAdjustmentInput,
): Promise<PerformWalletAdjustmentResult> {
  const { adminUserId, targetUserId, type, amountInPaise, category, reason, notes } = input

  if (!targetUserId || !type || !amountInPaise || !category) {
    return { error: "Missing required fields", status: 400 }
  }
  if (!["credit", "debit"].includes(type)) {
    return { error: "Type must be credit or debit", status: 400 }
  }
  if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
    return { error: "Amount must be a positive number", status: 400 }
  }

  try {
    return await withTransaction(async (tx) => {
      // Get target user role if available
      const userRes = await tx.query("SELECT role FROM users WHERE id = $1", [targetUserId])
      if (userRes.rows.length === 0) {
        return { error: "Target user not found", status: 404 }
      }
      const targetUserRole = userRes.rows[0].role as string | null

      // Lock or create wallet atomically inside transaction
      let walletRes = await tx.query(
        "SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE",
        [targetUserId],
      )
      if (walletRes.rows.length === 0) {
        await tx.query(
          "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0, 'INR') ON CONFLICT (user_id) DO NOTHING",
          [targetUserId],
        )
        walletRes = await tx.query(
          "SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE",
          [targetUserId],
        )
      }

      if (walletRes.rows.length === 0) {
        return { error: "Wallet not found for target user", status: 404 }
      }

      const wallet = walletRes.rows[0] as { id: string; balance: number | string }
      const balanceBefore = Math.round(Number(wallet.balance))
      let balanceAfter = balanceBefore

      if (type === "credit") {
        balanceAfter += amountInPaise
      } else {
        balanceAfter -= amountInPaise
        if (balanceAfter < 0) {
          return { error: "Insufficient wallet balance for debit adjustment", status: 400 }
        }
      }

      // Valid enum values in Postgres for wallet_transactions.category (txn_category):
      const validTxnCategories = [
        "top_up",
        "credit_purchase",
        "service_charge",
        "order_refund",
        "adjustment",
        "manual_adjustment",
        "payment_recovery",
        "compensation",
        "correction",
        "goodwill",
        "ai_image_generation",
        "whitelabel_hosting",
        "domain_registration",
        "studio_upgrade",
        "annual_subscription",
        "photo_gallery_subscription",
        "photo_gallery_usage",
      ]

      // Valid enum values in Postgres for wallet_adjustments.category (adjustment_category):
      const validAdjCategories = [
        "goodwill",
        "compensation",
        "correction",
        "manual_top_up",
        "manual_debit",
        "promotional",
        "penalty",
      ]

      // Safely map category for wallet_transactions (requires txn_category enum)
      const txnCategory = validTxnCategories.includes(category)
        ? category
        : "manual_adjustment"

      // Safely map category for wallet_adjustments (requires adjustment_category enum)
      const adjCategory = validAdjCategories.includes(category)
        ? category
        : type === "credit"
          ? "manual_top_up"
          : "manual_debit"

      // Update wallet balance
      await tx.query(
        "UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2",
        [balanceAfter, wallet.id],
      )

      // Insert wallet_transactions record
      const desc = reason || `Manual ${type} by administrator`
      const txnRes = await tx.query(
        `INSERT INTO wallet_transactions
          (wallet_id, user_id, type, category, amount, balance_before, balance_after, description, performed_by, reason, notes)
         VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          wallet.id,
          targetUserId,
          type,
          txnCategory,
          amountInPaise,
          balanceBefore,
          balanceAfter,
          desc,
          adminUserId,
          reason || null,
          notes || null,
        ],
      )
      const txnId = (txnRes.rows[0] as { id: string }).id

      // Insert wallet_adjustments audit log
      await tx.query(
        `INSERT INTO wallet_adjustments
          (target_user_id, target_user_role, type, amount, reason, category, initiated_by, status, transaction_id, notes)
         VALUES
          ($1, $2, $3, $4, $5, $6, $7, 'completed', $8, $9)`,
        [
          targetUserId,
          targetUserRole,
          type,
          amountInPaise,
          reason,
          adjCategory,
          adminUserId,
          txnId,
          notes || null,
        ],
      )

      return {
        success: true,
        transaction: toCamel(txnRes.rows[0] as Record<string, unknown>),
        balanceAfter,
      }
    })
  } catch (err) {
    console.error("[performWalletAdjustment]", err)
    return { error: "Failed to perform wallet adjustment", status: 500 }
  }
}
