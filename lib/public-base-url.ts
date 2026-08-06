/**
 * Public origin for absolute URLs to `/api/uploads/...`.
 * Prefer the incoming request host so upload URLs match the browser origin (avoids www vs apex mismatches).
 * Fall back to NEXT_PUBLIC_APP_URL when host is unavailable (e.g. some scripts).
 */
export function getPublicBaseUrl(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "")
  const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host")
  const host = rawHost?.split(",")[0]?.trim()

  if (envUrl) {
    try {
      const parsedEnv = new URL(envUrl)
      if (host) {
        const hostNameOnly = host.split(":")[0]?.toLowerCase() || ""
        const envHostNameOnly = parsedEnv.hostname.toLowerCase()

        // Accept host header if it matches the configured environment host, is a subdomain, or is local dev
        const isAllowedHost =
          hostNameOnly === envHostNameOnly ||
          hostNameOnly.endsWith(`.${envHostNameOnly}`) ||
          hostNameOnly === "localhost" ||
          hostNameOnly === "127.0.0.1"

        if (isAllowedHost) {
          const proto =
            request.headers.get("x-forwarded-proto") ||
            (host.includes("localhost") ? "http" : "https")
          return `${proto}://${host}`
        }
      }
      return envUrl
    } catch {
      return envUrl
    }
  }

  if (host) {
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (host.includes("localhost") ? "http" : "https")
    return `${proto}://${host}`
  }

  return "http://localhost:3000"
}
