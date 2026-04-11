/** Seeded template previews from "Generate sample events" — `is_mock` in DB; legacy rows match title prefix. */
export function isSampleEvent(ev: { isMock?: boolean; title?: string | null }): boolean {
  if (ev.isMock === true) return true
  const t = typeof ev.title === "string" ? ev.title : ""
  return t.startsWith("Sample:")
}
