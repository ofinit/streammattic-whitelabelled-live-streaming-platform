import { getDb } from "@/lib/db"

export type PhotoGalleryWalletDebitCategory = "photo_gallery_subscription" | "photo_gallery_usage"

export async function debitUserWalletPaisa(params: {
  userId: string
  amountPaisa: number
  category: PhotoGalleryWalletDebitCategory
  description: string
  referenceId?: string | null
  referenceType?: string | null
}): Promise<{ ok: true; balanceAfter: number; walletId: string } | { ok: false; error: string }> {
  const { userId, amountPaisa, category, description, referenceId, referenceType } = params
  if (!Number.isFinite(amountPaisa) || amountPaisa <= 0) {
    return { ok: false, error: "Invalid amount" }
  }
  const sql = getDb()
  const updatedWallets = await sql`
    UPDATE wallets
    SET balance = balance - ${amountPaisa}, updated_at = NOW()
    WHERE user_id = ${userId} AND balance >= ${amountPaisa}
    RETURNING id, balance as new_balance, balance + ${amountPaisa} as old_balance
  `
  if (updatedWallets.length === 0) {
    return { ok: false, error: "Insufficient wallet balance" }
  }
  const wallet = updatedWallets[0] as Record<string, unknown>
  const walletId = String(wallet.id)
  const newBalance = wallet.new_balance as number
  const oldBalance = wallet.old_balance as number
  await sql`
    INSERT INTO wallet_transactions (
      wallet_id, user_id, type, category, amount, balance_before, balance_after,
      description, reference_id, reference_type
    )
    VALUES (
      ${walletId},
      ${userId},
      'debit',
      ${category},
      ${amountPaisa},
      ${oldBalance},
      ${newBalance},
      ${description},
      ${referenceId ?? null},
      ${referenceType ?? null}
    )
  `
  return { ok: true, balanceAfter: newBalance, walletId }
}
