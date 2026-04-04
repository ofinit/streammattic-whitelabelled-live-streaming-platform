import {
  getPlatformARecordIp,
  getPlatformCnameTarget,
  getVerificationTxtNameForCloudflare,
  parseDomainLayout,
  PLATFORM_DNS_CONFIGURE_ENV_HINT,
} from "@/lib/platform-dns"

const CF_API_BASE = "https://api.cloudflare.com/client/v4"

interface CloudflareResponse<T> {
  success: boolean
  errors: Array<{ code: number; message: string }>
  messages: Array<{ code: number; message: string }>
  result: T
}

export interface CloudflareZone {
  id: string
  name: string
  status: string
}

export interface CloudflareDnsRecord {
  id: string
  type: string
  name: string
  content: string
  ttl: number
  proxied: boolean
}

interface CreateRecordParams {
  type: "A" | "CNAME" | "TXT"
  name: string
  content: string
  ttl?: number
  proxied?: boolean
}

// ─── Helper ────────────────────────────────────────────────────
async function cfFetch<T>(
  path: string,
  apiToken: string,
  options: RequestInit = {}
): Promise<CloudflareResponse<T>> {
  const res = await fetch(`${CF_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Cloudflare API ${res.status}: ${text}`)
  }

  return res.json()
}

// ─── Verify Token ──────────────────────────────────────────────
export async function verifyApiToken(
  apiToken: string
): Promise<{ valid: boolean; message: string }> {
  try {
    const data = await cfFetch<{ id: string; status: string }>(
      "/user/tokens/verify",
      apiToken
    )
    if (data.success && data.result.status === "active") {
      return { valid: true, message: "Token is valid" }
    }
    return { valid: false, message: "Token is inactive" }
  } catch {
    return { valid: false, message: "Invalid API token" }
  }
}

// ─── List Zones ────────────────────────────────────────────────
export async function getZonesByToken(
  apiToken: string
): Promise<CloudflareZone[]> {
  const data = await cfFetch<CloudflareZone[]>(
    "/zones?status=active&per_page=50",
    apiToken
  )
  return data.result || []
}

// ─── List DNS Records (filtered) ──────────────────────────────
export async function listDnsRecords(
  apiToken: string,
  zoneId: string,
  filters?: { name?: string; type?: string }
): Promise<CloudflareDnsRecord[]> {
  const params = new URLSearchParams()
  if (filters?.name) params.set("name", filters.name)
  if (filters?.type) params.set("type", filters.type)

  const qs = params.toString() ? `?${params.toString()}` : ""
  const data = await cfFetch<CloudflareDnsRecord[]>(
    `/zones/${zoneId}/dns_records${qs}`,
    apiToken
  )
  return data.result || []
}

// ─── Create DNS Record ────────────────────────────────────────
export async function createDnsRecord(
  apiToken: string,
  zoneId: string,
  params: CreateRecordParams
): Promise<CloudflareDnsRecord> {
  const data = await cfFetch<CloudflareDnsRecord>(
    `/zones/${zoneId}/dns_records`,
    apiToken,
    {
      method: "POST",
      body: JSON.stringify({
        type: params.type,
        name: params.name,
        content: params.content,
        ttl: params.ttl || 1, // 1 = auto
        proxied: params.proxied ?? false, // DNS-only (grey cloud) so traffic reaches your origin / Traefik
      }),
    }
  )
  return data.result
}

// ─── Delete DNS Record ────────────────────────────────────────
export async function deleteDnsRecord(
  apiToken: string,
  zoneId: string,
  recordId: string
): Promise<boolean> {
  const data = await cfFetch<{ id: string }>(
    `/zones/${zoneId}/dns_records/${recordId}`,
    apiToken,
    { method: "DELETE" }
  )
  return data.success
}

// ─── Auto-Configure Domain ────────────────────────────────────
// Creates routing + verification TXT for your platform (Coolify / self-hosted).
export async function autoConfigureDomain(
  apiToken: string,
  zoneId: string,
  domain: string,
  verificationToken: string
): Promise<{
  success: boolean
  records: CloudflareDnsRecord[]
  errors: string[]
}> {
  const createdRecords: CloudflareDnsRecord[] = []
  const errors: string[] = []

  const { isSubdomain, subdomain } = parseDomainLayout(domain)

  const cnameTarget = getPlatformCnameTarget()
  const aRecordIp = getPlatformARecordIp()

  if (isSubdomain && !cnameTarget) {
    errors.push(`Missing NEXT_PUBLIC_PLATFORM_CNAME_TARGET. ${PLATFORM_DNS_CONFIGURE_ENV_HINT}`)
    return { success: false, records: [], errors }
  }
  if (!isSubdomain && !aRecordIp) {
    errors.push(`Missing NEXT_PUBLIC_PLATFORM_A_RECORD_IP. ${PLATFORM_DNS_CONFIGURE_ENV_HINT}`)
    return { success: false, records: [], errors }
  }

  try {
    // 1. Create routing record (CNAME for subdomain, A for root)
    if (isSubdomain) {
      // Check for existing CNAME on this subdomain
      const existing = await listDnsRecords(apiToken, zoneId, {
        name: domain,
        type: "CNAME",
      })
      if (existing.length > 0) {
        // Delete old CNAME first to avoid conflicts
        for (const rec of existing) {
          await deleteDnsRecord(apiToken, zoneId, rec.id)
        }
      }

      const cname = await createDnsRecord(apiToken, zoneId, {
        type: "CNAME",
        name: subdomain,
        content: cnameTarget!,
        proxied: false,
      })
      createdRecords.push(cname)
    } else {
      // Check for existing A record on root
      const existing = await listDnsRecords(apiToken, zoneId, {
        name: domain,
        type: "A",
      })
      if (existing.length > 0) {
        for (const rec of existing) {
          await deleteDnsRecord(apiToken, zoneId, rec.id)
        }
      }

      const aRecord = await createDnsRecord(apiToken, zoneId, {
        type: "A",
        name: "@",
        content: aRecordIp!,
        proxied: false,
      })
      createdRecords.push(aRecord)
    }

    // 2. Create TXT verification record
    const txtHost = getVerificationTxtNameForCloudflare(domain)

    // Remove existing TXT if present (same relative name as create)
    const existingTxt = await listDnsRecords(apiToken, zoneId, {
      name: txtHost,
      type: "TXT",
    })
    if (existingTxt.length > 0) {
      for (const rec of existingTxt) {
        await deleteDnsRecord(apiToken, zoneId, rec.id)
      }
    }

    const txt = await createDnsRecord(apiToken, zoneId, {
      type: "TXT",
      name: txtHost,
      content: verificationToken,
      proxied: false,
    })
    createdRecords.push(txt)
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "Unknown error creating DNS records")
  }

  return {
    success: errors.length === 0 && createdRecords.length >= 2,
    records: createdRecords,
    errors,
  }
}
