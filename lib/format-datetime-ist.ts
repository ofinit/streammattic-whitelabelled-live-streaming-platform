/** Format timestamps in India Standard Time with 12-hour clock (for admin UI). */
export function formatDateTimeIst(iso: string | Date | null | undefined): string {
  if (iso == null) return "—"
  const d = typeof iso === "string" ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(d)
}
