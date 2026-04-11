/**
 * Normalize control-center search input so pasting a watch URL still finds the event by slug.
 * Example: https://www.streamlivee.com/sample-yoga → sample-yoga
 */
export function normalizeEventSearchInput(raw: string): string {
  const t = raw.trim()
  if (!t) return ""

  try {
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`
    const url = new URL(withProto)
    if (url.hostname.includes(".")) {
      const segs = url.pathname.split("/").filter(Boolean)
      if (segs.length > 0) {
        try {
          return decodeURIComponent(segs[segs.length - 1]!)
        } catch {
          return segs[segs.length - 1]!
        }
      }
    }
  } catch {
    // not a URL; use raw text
  }

  return t
}
