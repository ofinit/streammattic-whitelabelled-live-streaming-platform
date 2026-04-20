/**
 * Normalize logo/hero URLs from studio_branding so images load on custom domains.
 * Uploads are often saved as `${NEXT_PUBLIC_APP_URL}/api/uploads/...`; on a white-label
 * host the browser must request `/api/uploads/...` on the current origin instead.
 */
export function normalizeBrandingImageUrl(src: string | undefined | null): string | null {
  if (src == null) return null
  let s = String(src).trim()
  if (!s) return null

  const appBase =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : ""

  if (appBase && (s.startsWith(`${appBase}/`) || s === appBase)) {
    try {
      const u = new URL(s)
      return `${u.pathname}${u.search}${u.hash}`
    } catch {
      /* fall through */
    }
  }

  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith("//")) return `https:${s}`
  if (s.startsWith("/")) return s
  return `/${s.replace(/^\/+/, "")}`
}
