import { randomBytes } from "crypto"
import { getDb } from "@/lib/db"
import { decrypt, encrypt } from "@/lib/encryption"
import type { StreamingBackendType } from "@/lib/streaming/types"

export const SRS_SETTINGS_KEY = "srs_streaming_settings"

const SECRET_PLACEHOLDER = "••••••••••••••••••••••••"

export type SrsSettings = {
  backendType: StreamingBackendType
  enabled: boolean
  serverName: string
  host: string
  apiUrl: string
  apiKey: string
  rtmpPort: number
  httpPort: number
  rtmpBaseUrl: string
  playbackBaseUrl: string
  hookSecret: string
  workerSecret: string
  tokenExpirySeconds: number
  sessionResumeSeconds: number
  mergeInactivitySeconds: number
  creditBlockMinutes: number
  recordingsRoot: string
  liveRecordingsDir: string
  finalRecordingsDir: string
  publicRecordingsBaseUrl: string
}

export type PublicSrsSettings = Omit<SrsSettings, "apiKey" | "hookSecret" | "workerSecret"> & {
  hasApiKey: boolean
  hasHookSecret: boolean
  hasWorkerSecret: boolean
  apiKey: string
  hookSecret: string
  workerSecret: string
}

type StoredSrsSettings = Omit<SrsSettings, "apiKey" | "hookSecret" | "workerSecret"> & {
  apiKeyEncrypted?: string | null
  hookSecretEncrypted?: string | null
  workerSecretEncrypted?: string | null
}

export const DEFAULT_SRS_SETTINGS: SrsSettings = {
  backendType: "srs",
  enabled: true,
  serverName: "Primary SRS Server",
  host: "rtmplive.in",
  apiUrl: "https://rtmplive.in/api",
  apiKey: "",
  rtmpPort: 1935,
  httpPort: 1985,
  rtmpBaseUrl: "rtmp://rtmplive.in/live",
  playbackBaseUrl: "https://rtmplive.in/live",
  hookSecret: "",
  workerSecret: "",
  tokenExpirySeconds: 30 * 24 * 60 * 60,
  sessionResumeSeconds: 5 * 60,
  mergeInactivitySeconds: 10 * 60,
  creditBlockMinutes: 360,
  recordingsRoot: "/root/recordings",
  liveRecordingsDir: "/root/recordings/recordings/live",
  finalRecordingsDir: "/root/recordings/final",
  publicRecordingsBaseUrl: "https://rtmplive.in/recordings",
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function numberOr(value: unknown, fallback: number, min = 0): number {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) && n >= min ? Math.floor(n) : fallback
}

function decryptSecret(value: unknown): string {
  return typeof value === "string" && value ? decrypt(value) || "" : ""
}

function normalizeStored(raw: unknown): SrsSettings {
  const data = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Partial<StoredSrsSettings>) : {}
  const defaults = DEFAULT_SRS_SETTINGS
  return {
    backendType: data.backendType === "srs" ? "srs" : defaults.backendType,
    enabled: typeof data.enabled === "boolean" ? data.enabled : defaults.enabled,
    serverName: stringOr(data.serverName, defaults.serverName),
    host: stringOr(data.host, defaults.host),
    apiUrl: stringOr(data.apiUrl, defaults.apiUrl),
    apiKey: decryptSecret(data.apiKeyEncrypted),
    rtmpPort: numberOr(data.rtmpPort, defaults.rtmpPort, 1),
    httpPort: numberOr(data.httpPort, defaults.httpPort, 1),
    rtmpBaseUrl: stringOr(data.rtmpBaseUrl, defaults.rtmpBaseUrl).replace(/\/$/, ""),
    playbackBaseUrl: stringOr(data.playbackBaseUrl, defaults.playbackBaseUrl).replace(/\/$/, ""),
    hookSecret: decryptSecret(data.hookSecretEncrypted),
    workerSecret: decryptSecret(data.workerSecretEncrypted),
    tokenExpirySeconds: numberOr(data.tokenExpirySeconds, defaults.tokenExpirySeconds, 60),
    sessionResumeSeconds: numberOr(data.sessionResumeSeconds, defaults.sessionResumeSeconds, 30),
    mergeInactivitySeconds: numberOr(data.mergeInactivitySeconds, defaults.mergeInactivitySeconds, 60),
    creditBlockMinutes: numberOr(data.creditBlockMinutes, defaults.creditBlockMinutes, 1),
    recordingsRoot: stringOr(data.recordingsRoot, defaults.recordingsRoot).replace(/\/$/, ""),
    liveRecordingsDir: stringOr(data.liveRecordingsDir, defaults.liveRecordingsDir).replace(/\/$/, ""),
    finalRecordingsDir: stringOr(data.finalRecordingsDir, defaults.finalRecordingsDir).replace(/\/$/, ""),
    publicRecordingsBaseUrl: stringOr(data.publicRecordingsBaseUrl, defaults.publicRecordingsBaseUrl).replace(/\/$/, ""),
  }
}

function toStored(settings: SrsSettings): StoredSrsSettings {
  const { apiKey, hookSecret, workerSecret, ...rest } = settings
  return {
    ...rest,
    apiKeyEncrypted: encrypt(apiKey),
    hookSecretEncrypted: encrypt(hookSecret),
    workerSecretEncrypted: encrypt(workerSecret),
  }
}

function withGeneratedSecrets(settings: SrsSettings): SrsSettings {
  return {
    ...settings,
    hookSecret: settings.hookSecret || randomBytes(24).toString("base64url"),
    workerSecret: settings.workerSecret || randomBytes(24).toString("base64url"),
  }
}

export async function getSrsSettings(): Promise<SrsSettings> {
  const sql = getDb()
  const rows = await sql`SELECT value FROM platform_settings WHERE key = ${SRS_SETTINGS_KEY}`
  return withGeneratedSecrets(normalizeStored(rows[0]?.value))
}

export function toPublicSrsSettings(settings: SrsSettings): PublicSrsSettings {
  return {
    ...settings,
    hasApiKey: !!settings.apiKey,
    hasHookSecret: !!settings.hookSecret,
    hasWorkerSecret: !!settings.workerSecret,
    apiKey: settings.apiKey ? SECRET_PLACEHOLDER : "",
    hookSecret: settings.hookSecret ? SECRET_PLACEHOLDER : "",
    workerSecret: settings.workerSecret ? SECRET_PLACEHOLDER : "",
  }
}

export async function getPublicSrsSettings(): Promise<PublicSrsSettings> {
  return toPublicSrsSettings(await getSrsSettings())
}

export async function saveSrsSettings(input: Partial<SrsSettings>): Promise<SrsSettings> {
  const current = await getSrsSettings()
  const merged: SrsSettings = {
    ...current,
    backendType: "srs",
    enabled: typeof input.enabled === "boolean" ? input.enabled : current.enabled,
    serverName: stringOr(input.serverName, current.serverName),
    host: stringOr(input.host, current.host),
    apiUrl: stringOr(input.apiUrl, current.apiUrl),
    apiKey:
      typeof input.apiKey === "string" && input.apiKey !== SECRET_PLACEHOLDER
        ? input.apiKey.trim()
        : current.apiKey,
    rtmpPort: numberOr(input.rtmpPort, current.rtmpPort, 1),
    httpPort: numberOr(input.httpPort, current.httpPort, 1),
    rtmpBaseUrl: stringOr(input.rtmpBaseUrl, current.rtmpBaseUrl).replace(/\/$/, ""),
    playbackBaseUrl: stringOr(input.playbackBaseUrl, current.playbackBaseUrl).replace(/\/$/, ""),
    hookSecret:
      typeof input.hookSecret === "string" && input.hookSecret !== SECRET_PLACEHOLDER
        ? input.hookSecret.trim()
        : current.hookSecret,
    workerSecret:
      typeof input.workerSecret === "string" && input.workerSecret !== SECRET_PLACEHOLDER
        ? input.workerSecret.trim()
        : current.workerSecret,
    tokenExpirySeconds: numberOr(input.tokenExpirySeconds, current.tokenExpirySeconds, 60),
    sessionResumeSeconds: numberOr(input.sessionResumeSeconds, current.sessionResumeSeconds, 30),
    mergeInactivitySeconds: numberOr(input.mergeInactivitySeconds, current.mergeInactivitySeconds, 60),
    creditBlockMinutes: numberOr(input.creditBlockMinutes, current.creditBlockMinutes, 1),
    recordingsRoot: stringOr(input.recordingsRoot, current.recordingsRoot).replace(/\/$/, ""),
    liveRecordingsDir: stringOr(input.liveRecordingsDir, current.liveRecordingsDir).replace(/\/$/, ""),
    finalRecordingsDir: stringOr(input.finalRecordingsDir, current.finalRecordingsDir).replace(/\/$/, ""),
    publicRecordingsBaseUrl: stringOr(input.publicRecordingsBaseUrl, current.publicRecordingsBaseUrl).replace(/\/$/, ""),
  }
  const finalSettings = withGeneratedSecrets(merged)
  const sql = getDb()
  await sql`
    INSERT INTO platform_settings (key, value, updated_at)
    VALUES (${SRS_SETTINGS_KEY}, ${JSON.stringify(toStored(finalSettings))}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `
  return finalSettings
}

export async function testSrsConnection(settings?: SrsSettings): Promise<{
  ok: boolean
  status?: number
  message: string
}> {
  const resolvedSettings = settings ?? await getSrsSettings()
  try {
    const headers: Record<string, string> = { Accept: "application/json" }
    if (resolvedSettings.apiKey) headers.Authorization = `Bearer ${resolvedSettings.apiKey}`
    const res = await fetch(`${resolvedSettings.apiUrl.replace(/\/$/, "")}/api/v1/summaries`, {
      headers,
      cache: "no-store",
    })
    if (!res.ok) {
      return { ok: false, status: res.status, message: `SRS API returned ${res.status}` }
    }
    return { ok: true, status: res.status, message: "SRS API is reachable" }
  } catch (error) {
    return { ok: false, message: (error as Error).message }
  }
}
