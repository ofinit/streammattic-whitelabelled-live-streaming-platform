/** Human-readable labels for wallet_transactions.category (txn_category). */
export const WALLET_TRANSACTION_CATEGORY_LABELS: Record<string, string> = {
  top_up: "Wallet Recharge",
  credit_purchase: "Credit Purchase",
  service_charge: "Service Charge",
  order_refund: "Refund",
  adjustment: "Adjustment",
  manual_adjustment: "Admin adjustment",
  payment_recovery: "Payment Recovery",
  compensation: "Compensation",
  correction: "Correction",
  goodwill: "Goodwill Credit",
  ai_image_generation: "AI Image Generation",
  whitelabel_hosting: "Whitelabel & Hosting",
  domain_registration: "Domain Registration",
  photo_gallery_subscription: "Client photo gallery subscription",
  photo_gallery_usage: "Client photo gallery usage",
}

export function formatWalletTransactionCategory(category: string): string {
  return WALLET_TRANSACTION_CATEGORY_LABELS[category] ?? category.replace(/_/g, " ")
}
