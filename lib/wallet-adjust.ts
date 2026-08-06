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
          category,
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
          (target_user_id, type, amount, reason, category, initiated_by, status, transaction_id)
         VALUES
          ($1, $2, $3, $4, $5, $6, 'completed', $7)`,
        [targetUserId, type, amountInPaise, reason, category, adminUserId, txnId],
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
