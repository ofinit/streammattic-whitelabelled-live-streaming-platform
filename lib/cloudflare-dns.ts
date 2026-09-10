import {
  getPlatformARecordIp,
  getPlatformCnameTarget,
  getCameraIngestDnsRecordForDomain,
  getVerificationTxtNameForCloudflare,
  getVerificationTxtPrefix,
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
  name_servers: string[]
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
    let errorMsg = `Cloudflare API ${res.status}`
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed.errors) && parsed.errors.length > 0) {
        errorMsg = parsed.errors
          .map((e: { code?: number; message?: string }) => e.message || `Code ${e.code}`)
          .filter(Boolean)
          .join(", ") || errorMsg
      }
    } catch {
      // ignore
    }
    if (res.status === 403) {
      errorMsg = `${errorMsg}. Please ensure the Cloudflare API Token has "Zone.DNS:Edit" permission.`
    }
    throw new Error(errorMsg)
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
  cnameTarget?: string,
  options?: {
    includeCameraIngest?: boolean
    cameraIngestTarget?: string
  },
): Promise<{
  success: boolean
  records: CloudflareDnsRecord[]
  errors: string[]
}> {
  const createdRecords: CloudflareDnsRecord[] = []
  const errors: string[] = []

  // 1. Fetch zone details from Cloudflare to obtain the authoritative zone apex name
  let zoneName = ""
  try {
    const zoneData = await cfFetch<CloudflareZone>(`/zones/${zoneId}`, apiToken)
    if (zoneData?.result?.name) {
      zoneName = zoneData.result.name.toLowerCase().trim()
    }
  } catch (e) {
    console.warn("[Cloudflare] Could not fetch zone info directly:", e)
  }

  const cleanDomain = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")

  if (!zoneName) {
    // Fallback: Infer zone name from cleanDomain by stripping www. if present
    const parts = cleanDomain.split(".").filter(Boolean)
    if (parts.length > 2 && parts[0] === "www") {
      zoneName = parts.slice(1).join(".")
    } else {
      zoneName = cleanDomain
    }
  }

  // Determine whether this is the zone's apex domain or a subdomain
  // e.g. "mactiveevents1.com" or "www.mactiveevents1.com" are both apex configuration for that zone
  const isApex = cleanDomain === zoneName || cleanDomain === `www.${zoneName}`
  const isSubdomain = !isApex && cleanDomain.endsWith(`.${zoneName}`)
  const subdomain = isSubdomain
    ? cleanDomain.slice(0, -(zoneName.length + 1))
    : parseDomainLayout(cleanDomain).subdomain

  if (isSubdomain && !cnameTarget && !platformIp) {
    errors.push(`Missing routing target (CNAME or A-Record IP) for subdomains.`)
    return { success: false, records: [], errors }
  }
  if (isApex && !platformIp) {
    errors.push(`Missing Platform A-Record IP for apex domains.`)
    return { success: false, records: [], errors }
  }

  // Helper to delete any conflicting existing records (A, AAAA, CNAME) by exact FQDN
  const deleteConflictingRecords = async (fqdn: string, typesToDelete: string[]) => {
    try {
      const existing = await listDnsRecords(apiToken, zoneId, { name: fqdn })
      for (const rec of existing) {
        if (typesToDelete.includes(rec.type.toUpperCase())) {
          await deleteDnsRecord(apiToken, zoneId, rec.id)
        }
      }
    } catch (err) {
      console.warn(`[Cloudflare] Failed to delete conflicting records for ${fqdn}:`, err)
    }
  }

  const prefix = getVerificationTxtPrefix()

  try {
    if (isApex) {
      // 1. Root apex record (@ -> platformIp)
      // Delete conflicting A, AAAA, CNAME records on the apex FQDN
      await deleteConflictingRecords(zoneName, ["A", "AAAA", "CNAME"])
      const rootRecord = await createDnsRecord(apiToken, zoneId, {
        type: "A",
        name: "@",
        content: platformIp,
        proxied: false,
      })
      createdRecords.push(rootRecord)

      // 2. www record (www -> platformIp)
      // Delete conflicting A, AAAA, CNAME records on www.zone FQDN
      await deleteConflictingRecords(`www.${zoneName}`, ["A", "AAAA", "CNAME"])
      const wwwRecord = await createDnsRecord(apiToken, zoneId, {
        type: "A",
        name: "www",
        content: platformIp,
        proxied: false,
      })
      createdRecords.push(wwwRecord)

      // 3. Verification TXT record (_verify -> verificationToken)
      const txtFqdn = `${prefix}.${zoneName}`
      await deleteConflictingRecords(txtFqdn, ["TXT"])
      const txtRecord = await createDnsRecord(apiToken, zoneId, {
        type: "TXT",
        name: prefix,
        content: verificationToken,
        proxied: false,
      })
      createdRecords.push(txtRecord)

      // 4. Camera Ingest SFTP record (optional)
      if (options?.includeCameraIngest && options.cameraIngestTarget) {
        const cameraRecordInfo = getCameraIngestDnsRecordForDomain(zoneName, options.cameraIngestTarget)
        if (cameraRecordInfo) {
          await deleteConflictingRecords(cameraRecordInfo.fullHost, ["A", "AAAA", "CNAME"])
          const cameraRecord = await createDnsRecord(apiToken, zoneId, {
            type: cameraRecordInfo.type,
            name: cameraRecordInfo.host,
            content: cameraRecordInfo.value,
            proxied: false,
          })
          createdRecords.push(cameraRecord)
        }
      }
    } else {
      // SUBDOMAIN: e.g. live.example.com
      const subFqdn = `${subdomain}.${zoneName}`
      await deleteConflictingRecords(subFqdn, ["A", "AAAA", "CNAME"])

      const routingRecord = await createDnsRecord(apiToken, zoneId, {
        type: cnameTarget ? "CNAME" : "A",
        name: subdomain,
        content: cnameTarget || platformIp,
        proxied: false,
      })
      createdRecords.push(routingRecord)

      // Verification TXT: _verify.<subdomain>
      const txtHost = `${prefix}.${subdomain}`
      const txtFqdn = `${txtHost}.${zoneName}`
      await deleteConflictingRecords(txtFqdn, ["TXT"])
      const txtRecord = await createDnsRecord(apiToken, zoneId, {
        type: "TXT",
        name: txtHost,
        content: verificationToken,
        proxied: false,
      })
      createdRecords.push(txtRecord)

      if (options?.includeCameraIngest && options.cameraIngestTarget) {
        const cameraRecordInfo = getCameraIngestDnsRecordForDomain(cleanDomain, options.cameraIngestTarget)
        if (cameraRecordInfo) {
          await deleteConflictingRecords(cameraRecordInfo.fullHost, ["A", "AAAA", "CNAME"])
          const cameraRecord = await createDnsRecord(apiToken, zoneId, {
            type: cameraRecordInfo.type,
            name: cameraRecordInfo.host,
            content: cameraRecordInfo.value,
            proxied: false,
          })
          createdRecords.push(cameraRecord)
        }
      }
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "Unknown error creating DNS records")
  }

  const requiredCount = isApex ? 3 : 2
  return {
    success: errors.length === 0 && createdRecords.length >= requiredCount,
    records: createdRecords,
    errors,
  }
}
