import type { WalletTransaction } from "@/lib/types"
import { formatWalletTransactionCategory } from "@/lib/wallet-category-labels"

/** Matches [`app/api/admin/wallets/adjust/route.ts`] insert description. */
export const ADMIN_MANUAL_TXN_DESCRIPTION = "Manual Administrator Adjustment"

export function isAdminManualWalletTransaction(
  txn: Pick<WalletTransaction, "category" | "description">,
): boolean {
  return (
    txn.category === "manual_adjustment" ||
    (typeof txn.description === "string" && txn.description === ADMIN_MANUAL_TXN_DESCRIPTION)
  )
}

export function getWalletTransactionPrimaryLabel(txn: WalletTransaction): string {
  if (isAdminManualWalletTransaction(txn)) {
    return txn.type === "credit" ? "Funds added by admin" : "Funds debited by admin"
  }
  if (txn.description && String(txn.description).trim()) {
    return String(txn.description).trim()
  }
  return formatWalletTransactionCategory(txn.category)
}

/** Subtitle for admin manual rows when reason was stored. */
export function getWalletTransactionReasonLine(
  txn: Pick<WalletTransaction, "category" | "description" | "reason">,
): string | null {
  if (!isAdminManualWalletTransaction(txn)) return null
  const r = txn.reason
  if (r == null || typeof r !== "string") return null
  const t = r.trim()
  return t.length > 0 ? t : null
}
