/**
 * Shared currency formatting for admin finance views.
 * Refund workflow logic lives in API routes and the database.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount)
}
