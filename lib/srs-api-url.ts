export type SrsApiConnection = {
  apiKey?: string
}

export type SrsApiFetchResult<T = unknown> = {
  ok: boolean
  status?: number
  url: string
  data?: T
  message: string
}

export function getSrsApiBaseUrl() {
  if (typeof window === "undefined") {
    return "http://127.0.0.1:1985/api/v1"
  }
  return "https://rtmplive.in/api/v1"
}

export function buildSrsApiUrl(endpoint: string, baseUrl = getSrsApiBaseUrl()): string {
  const base = baseUrl.trim().replace(/\/+$/, "")
  const path = endpoint.trim().replace(/^\/+/, "").replace(/^api\/v1\//, "")

  return `${base}/${path}`
}

export function formatSrsFetchError(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  const cause = error.cause
  if (cause && typeof cause === "object") {
    const details = cause as Record<string, unknown>
    const parts = [details.code, details.errno, details.syscall, details.hostname]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
    if (parts.length > 0) return `${error.message} (${parts.join(", ")})`
  }
  return error.message
}

function normalizeHeaders(headers: HeadersInit | undefined): Record<string, string> {
  const normalized: Record<string, string> = {}
  if (!headers) return normalized
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      normalized[key] = value
    })
    return normalized
  }
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) normalized[key] = value
    return normalized
  }
  return { ...headers }
}

export async function fetchSrsApiJson<T = unknown>(
  settings: SrsApiConnection,
  endpoint: string,
  init: RequestInit = {},
): Promise<SrsApiFetchResult<T>> {
  const url = buildSrsApiUrl(endpoint)
  const headers = normalizeHeaders(init.headers)
  headers.Accept ||= "application/json"
  if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`

  try {
    const res = await fetch(url, {
      ...init,
      method: init.method || "GET",
      headers,
      cache: "no-store",
    })
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        url,
        message: `SRS API returned ${res.status} for ${url}`,
      }
    }
    return {
      ok: true,
      status: res.status,
      url,
      data: await res.json() as T,
      message: `SRS API is reachable at ${url}`,
    }
  } catch (error) {
    return {
      ok: false,
      url,
      message: `${formatSrsFetchError(error)} while fetching ${url}`,
    }
  }
}
