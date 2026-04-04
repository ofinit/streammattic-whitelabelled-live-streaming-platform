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
  verificationToken: string,
  platformIp: string,
  cnameTarget?: string
): Promise<{
  success: boolean
  records: CloudflareDnsRecord[]
  errors: string[]
}> {
  const createdRecords: CloudflareDnsRecord[] = []
  const errors: string[] = []

  const { isSubdomain, subdomain } = parseDomainLayout(domain)

  if (isSubdomain && !cnameTarget) {
    errors.push(`Missing CNAME target for subdomains.`)
    return { success: false, records: [], errors }
  }
  if (!isSubdomain && !platformIp) {
    errors.push(`Missing Platform A-Record IP for apex domains.`)
    return { success: false, records: [], errors }
  }

  try {
    // 1. Create routing record (A record for subdomain, or A for root + www for apex)
    if (isSubdomain) {
      // Check/Delete existing A or CNAME records on this subdomain
      const existing = await listDnsRecords(apiToken, zoneId, {
        name: domain,
      })
      if (existing.length > 0) {
        for (const rec of existing) {
          if (rec.type === "A" || rec.type === "CNAME") {
            await deleteDnsRecord(apiToken, zoneId, rec.id)
          }
        }
      }

      const aRecord = await createDnsRecord(apiToken, zoneId, {
        type: "A",
        name: subdomain,
        content: platformIp,
        proxied: false,
      })
      createdRecords.push(aRecord)
    } else {
      // APEX DOMAIN: Create A records for both @ and www
      const targets = ["@", "www"]
      
      for (const target of targets) {
        const recordName = target === "@" ? domain : `${target}.${domain}`
        
        // 1a. Check/Delete existing A records
        const existing = await listDnsRecords(apiToken, zoneId, {
          name: recordName,
          type: "A",
        })
        if (existing.length > 0) {
          for (const rec of existing) {
            await deleteDnsRecord(apiToken, zoneId, rec.id)
          }
        }

        // 1b. Create new A record
        const aRecord = await createDnsRecord(apiToken, zoneId, {
          type: "A",
          name: target,
          content: platformIp,
          proxied: false,
        })
        createdRecords.push(aRecord)
      }
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
    success: errors.length === 0 && createdRecords.length >= (isSubdomain ? 2 : 3),
    records: createdRecords,
    errors,
  }
}
