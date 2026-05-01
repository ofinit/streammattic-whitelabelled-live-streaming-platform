import http from "node:http"
import https from "node:https"
import type { LookupFunction } from "node:net"

export type SrsApiConnection = {
  host?: string
  apiUrl?: string
  httpPort?: number | string | ""
  apiKey?: string
}

export type SrsApiFetchResult<T = unknown> = {
  ok: boolean
  status?: number
  url: string
  data?: T
  message: string
  usedFallback?: boolean
  fallbackAddress?: string
}

const DEFAULT_DNS_FALLBACKS: Record<string, string> = {
  "rtmplive.in": "45.252.190.27",
}

export function cleanSrsHost(host: string): string {
  return host.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "")
}

function normalizePort(port: SrsApiConnection["httpPort"]): string {
  if (port === undefined || port === null) return ""
  return String(port).trim()
}

function hostFromApiUrl(apiUrl: string): string {
  try {
    return new URL(apiUrl).hostname
  } catch {
    return ""
  }
}

export function buildSrsApiBaseUrl(settings: SrsApiConnection): string {
  const explicitApiUrl = typeof settings.apiUrl === "string" ? settings.apiUrl.trim().replace(/\/+$/, "") : ""
  const port = normalizePort(settings.httpPort)
  const host = cleanSrsHost(settings.host || hostFromApiUrl(explicitApiUrl))

  if (port) return `http://${host}:${port}`
  if (explicitApiUrl) return explicitApiUrl
  return `https://${host}/api`
}

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

export function buildSrsEndpointUrl(settings: SrsApiConnection, endpoint: string): string {
  return buildSrsApiUrl(buildSrsApiBaseUrl(settings), endpoint)
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

function isDnsFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const cause = error.cause
  if (!cause || typeof cause !== "object") return false
  const code = (cause as Record<string, unknown>).code
  return code === "EAI_AGAIN" || code === "ENOTFOUND"
}

function fallbackAddressFor(url: string): string {
  const configured = process.env.SRS_API_FALLBACK_HOST?.trim()
  if (configured) return configured

  try {
    const host = new URL(url).hostname
    return DEFAULT_DNS_FALLBACKS[host] || ""
  } catch {
    return ""
  }
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

async function fetchJsonWithLookup<T>(url: string, init: RequestInit, fallbackAddress: string): Promise<SrsApiFetchResult<T>> {
  const parsed = new URL(url)
  const transport = parsed.protocol === "https:" ? https : http
  const headers = normalizeHeaders(init.headers)
  const method = init.method || "GET"
  const body = typeof init.body === "string" || Buffer.isBuffer(init.body) ? init.body : undefined

  const lookup: LookupFunction = (_hostname, _options, callback) => {
    callback(null, fallbackAddress, 4)
  }

  return new Promise((resolve) => {
    const req = transport.request(
      parsed,
      { method, headers, lookup },
      (res) => {
        const chunks: Buffer[] = []
        res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8")
          const status = res.statusCode || 0
          if (status < 200 || status >= 300) {
            resolve({
              ok: false,
              status,
              url,
              message: `SRS API returned ${status} for ${url}${text ? `: ${text}` : ""}`,
              usedFallback: true,
              fallbackAddress,
            })
            return
          }
          try {
            resolve({
              ok: true,
              status,
              url,
              data: text ? JSON.parse(text) as T : undefined,
              message: `SRS API is reachable at ${url}`,
              usedFallback: true,
              fallbackAddress,
            })
          } catch (error) {
            resolve({
              ok: false,
              status,
              url,
              message: `SRS API returned invalid JSON for ${url}: ${formatSrsFetchError(error)}`,
              usedFallback: true,
              fallbackAddress,
            })
          }
        })
      },
    )

    req.on("error", (error) => {
      resolve({
        ok: false,
        url,
        message: `${formatSrsFetchError(error)} while fetching ${url}`,
        usedFallback: true,
        fallbackAddress,
      })
    })

    if (body) req.write(body)
    req.end()
  })
}

export async function fetchSrsApiJson<T = unknown>(
  settings: SrsApiConnection,
  endpoint: string,
  init: RequestInit = {},
): Promise<SrsApiFetchResult<T>> {
  const url = buildSrsEndpointUrl(settings, endpoint)
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
    const fallbackAddress = fallbackAddressFor(url)
    if (fallbackAddress && isDnsFailure(error)) {
      return fetchJsonWithLookup<T>(url, { ...init, method: init.method || "GET", headers }, fallbackAddress)
    }
    return {
      ok: false,
      url,
      message: `${formatSrsFetchError(error)} while fetching ${url}`,
    }
  }
}
