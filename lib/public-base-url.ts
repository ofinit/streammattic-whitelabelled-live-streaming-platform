/**
 * Public origin for absolute URLs to `/api/uploads/...`.
 * Prefer the incoming request host so upload URLs match the browser origin (avoids www vs apex mismatches).
 * Fall back to NEXT_PUBLIC_APP_URL when host is unavailable (e.g. some scripts).
 */
export function getPublicBaseUrl(request: Request): string {
  const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host")
  const host = rawHost?.split(",")[0]?.trim()
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (host?.includes("localhost") ? "http" : "https")
  if (host) {
    return `${proto}://${host}`
  }
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl) return envUrl.replace(/\/$/, "")
  return "http://localhost:3000"
}
