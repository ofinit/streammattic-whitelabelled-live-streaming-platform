export function getEventPhotographerName(event: unknown): string {
  if (!event || typeof event !== "object") return ""
  const record = event as Record<string, unknown>
  const contact = record.photographerContact ?? record.photographer_contact
  if (!contact || typeof contact !== "object") return ""
  const name = (contact as Record<string, unknown>).name
  return typeof name === "string" ? name.trim() : ""
}

