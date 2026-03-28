/** Parse platform setting `studio_annual_subscription` for streamer-facing UI. */
export function parseStudioAnnualSubscription(value: unknown): { enabled: boolean; pricePaisa: number } | null {
  if (!value || typeof value !== "object") return null
  const s = value as Record<string, unknown>
  if (typeof s.price !== "number" || !Number.isFinite(s.price)) return null
  return {
    enabled: s.enabled !== false,
    pricePaisa: s.price,
  }
}
