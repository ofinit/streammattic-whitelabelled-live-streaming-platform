export function buildSrsApiUrl(baseUrl: string, endpoint: string): string {
  const base = baseUrl.trim().replace(/\/+$/, "")
  let path = endpoint.trim().replace(/^\/+/, "")

  try {
    const url = new URL(base)
    const basePath = url.pathname.replace(/\/+$/, "")
    if (basePath === "/api" || basePath.endsWith("/api")) {
      path = path.replace(/^api\//, "")
    }
  } catch {
    // If baseUrl is not absolute, fall back to simple joining.
  }

  return `${base}/${path}`
}
