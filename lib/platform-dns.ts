/**
 * Platform DNS targets for self-hosted deployments (e.g. Coolify / Traefik).
 * No vendor-specific defaults — set NEXT_PUBLIC_* in your deployment environment.
 */

const DEFAULT_VERIFICATION_TXT_PREFIX = "_verify"

export const PLATFORM_DNS_CONFIGURE_ENV_HINT =
  "Set NEXT_PUBLIC_PLATFORM_A_RECORD_IP (used for apex @ and www) and NEXT_PUBLIC_PLATFORM_CNAME_TARGET (for additional subdomains) in your deployment environment (e.g. Coolify)."

export const CAMERA_INGEST_DNS_CONFIGURE_ENV_HINT =
  "Set CLIENT_GALLERY_CAMERA_INGEST_HOST to your central FTP/SFTP gateway hostname, or CLIENT_GALLERY_CAMERA_INGEST_DNS_TARGET to override the DNS target."

export function getVerificationTxtPrefix(): string {
  const raw = process.env.NEXT_PUBLIC_DOMAIN_VERIFICATION_TXT_PREFIX?.trim()
  if (!raw) return DEFAULT_VERIFICATION_TXT_PREFIX
  return raw.replace(/^\.+|\.+$/g, "") || DEFAULT_VERIFICATION_TXT_PREFIX
}

export function getPlatformCnameTarget(override?: string): string | undefined {
  if (override) return override.trim()
  const v = process.env.NEXT_PUBLIC_PLATFORM_CNAME_TARGET?.trim()
  return v || undefined
}

export function getPlatformARecordIp(override?: string): string | undefined {
  if (override) return override.trim()
  const v = process.env.NEXT_PUBLIC_PLATFORM_A_RECORD_IP?.trim()
  return v || undefined
}

/** UI / monospace display when env is unset (no fake vendor defaults). */
export function getPlatformCnameDisplay(override?: string): string {
  return getPlatformCnameTarget(override) ?? "— (set NEXT_PUBLIC_PLATFORM_CNAME_TARGET)"
}

export function getPlatformARecordDisplay(override?: string): string {
  return getPlatformARecordIp(override) ?? "— (set NEXT_PUBLIC_PLATFORM_A_RECORD_IP)"
}

export function getCameraIngestDnsTarget(override?: string): string | undefined {
  if (override) return override.trim()
  const publicExplicit = process.env.NEXT_PUBLIC_CLIENT_GALLERY_CAMERA_INGEST_DNS_TARGET?.trim()
  if (publicExplicit) return publicExplicit
  const publicGatewayHost = process.env.NEXT_PUBLIC_CLIENT_GALLERY_CAMERA_INGEST_HOST?.trim()
  if (publicGatewayHost) return publicGatewayHost
  const explicit = process.env.CLIENT_GALLERY_CAMERA_INGEST_DNS_TARGET?.trim()
  if (explicit) return explicit
  const gatewayHost = process.env.CLIENT_GALLERY_CAMERA_INGEST_HOST?.trim()
  return gatewayHost || undefined
}

export function getCameraIngestDnsTargetDisplay(override?: string): string {
  return getCameraIngestDnsTarget(override) ?? "— (set CLIENT_GALLERY_CAMERA_INGEST_HOST)"
}

function isIpv4Address(value: string): boolean {
  const parts = value.trim().split(".")
  return parts.length === 4 && parts.every((part) => {
    if (!/^\d+$/.test(part)) return false
    const n = Number(part)
    return n >= 0 && n <= 255
  })
}

function normalizedApexHost(domain: string): string {
  const parts = domain.trim().toLowerCase().split(".").filter(Boolean)
  if (parts.length > 2 && parts[0] === "www") {
    return parts.slice(1).join(".")
  }
  return parts.join(".")
}

export function getCameraIngestHostnameForDomain(domain: string): string {
  const host = normalizedApexHost(domain)
  return host ? `sftp.${host}` : "sftp"
}

export function getCameraIngestDnsHostDisplay(domain: string): string {
  const host = normalizedApexHost(domain)
  const { isSubdomain, subdomain } = parseDomainLayout(host)
  return isSubdomain ? `sftp.${subdomain}` : "sftp"
}

export function getCameraIngestDnsRecordForDomain(
  domain: string,
  targetOverride?: string,
): { type: "A" | "CNAME"; host: string; fullHost: string; value: string; ttl: number } | null {
  const value = getCameraIngestDnsTarget(targetOverride)
  if (!value) return null
  return {
    type: isIpv4Address(value) ? "A" : "CNAME",
    host: getCameraIngestDnsHostDisplay(domain),
    fullHost: getCameraIngestHostnameForDomain(domain),
    value,
    ttl: 3600,
  }
}

export function parseDomainLayout(domain: string): { isSubdomain: boolean; subdomain: string } {
  const domainParts = domain.split(".").filter(Boolean)
  
  // If user entered www.example.com, treat it as example.com apex
  let effectiveParts = domainParts
  if (domainParts.length > 2 && domainParts[0].toLowerCase() === "www") {
    effectiveParts = domainParts.slice(1)
  }

  const isSubdomain = effectiveParts.length > 2
  const subdomain = isSubdomain ? effectiveParts.slice(0, -2).join(".") : ""
  
  // If it's the apex case (even if they typed 'www'), 
  // 'subdomain' for the purpose of path routing (like Traefik) should be empty
  return { isSubdomain, subdomain }
}

/**
 * Host label(s) for the verification TXT record (as shown in registrar UI).
 * - Apex example.com → `_verify`
 * - Subdomain live.example.com → `_verify.live`
 */
export function getVerificationTxtHostDisplay(domain: string): string {
  const prefix = getVerificationTxtPrefix()
  const { isSubdomain, subdomain } = parseDomainLayout(domain)
  if (isSubdomain) {
    return `${prefix}.${subdomain}`
  }
  return prefix
}

/** Same host string used for Cloudflare `createDnsRecord` / list filters (relative to zone). */
export function getVerificationTxtNameForCloudflare(domain: string): string {
  return getVerificationTxtHostDisplay(domain)
}

export function isRoutingConfiguredForDomain(domain: string): boolean {
  const { isSubdomain } = parseDomainLayout(domain)
  if (isSubdomain) {
    return Boolean(getPlatformCnameTarget())
  }
  return Boolean(getPlatformARecordIp())
}

/**
 * Primary routing target for display: CNAME for subdomains, A for apex.
 */
export function getRoutingTargetDisplayForDomain(domain: string): string {
  const { isSubdomain } = parseDomainLayout(domain)
  if (isSubdomain) {
    return getPlatformCnameDisplay()
  }
  return getPlatformARecordDisplay()
}

/** Optional comma-separated substrings; hostnames containing any match skip white-label lookup (preview/dev). */
export function hostnameMatchesDevHints(hostname: string): boolean {
  const raw = process.env.NEXT_PUBLIC_DEV_HOST_HINTS?.trim()
  if (!raw) return false
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .some((hint) => hostname.includes(hint))
}
