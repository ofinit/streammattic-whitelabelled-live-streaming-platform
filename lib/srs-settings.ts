import { randomBytes } from "crypto"
import { getDb } from "@/lib/db"
import { decrypt, encrypt } from "@/lib/encryption"
import { fetchSrsApiJson } from "@/lib/srs-api-url"
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
  httpPort?: string
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
  fiveCentsCdnServerId: number
  fiveCentsCdnCodec: string
  fiveCentsCdnProtocols: string[]
  fiveCentsCdnDvrEnabled: boolean
  fiveCentsCdnDvrRetentionDays: number
  fiveCentsCdnCriticalBackupEnabled: boolean
  fiveCentsCdnCriticalBackupProvider: "wasabi"
  fiveCentsCdnCriticalBackupName: string
  fiveCentsCdnCriticalBackupZone: string
  fiveCentsCdnWasabiBucket: string
  fiveCentsCdnWasabiEndpoint: string
}

export type StreamingSettings = SrsSettings

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
  httpPort: "",
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
  fiveCentsCdnServerId: 212,
  fiveCentsCdnCodec: "h264",
  fiveCentsCdnProtocols: ["RTMP", "HLS"],
  fiveCentsCdnDvrEnabled: true,
  fiveCentsCdnDvrRetentionDays: 14,
  fiveCentsCdnCriticalBackupEnabled: true,
  fiveCentsCdnCriticalBackupProvider: "wasabi",
  fiveCentsCdnCriticalBackupName: "Wasabi Object Storage",
  fiveCentsCdnCriticalBackupZone: "",
  fiveCentsCdnWasabiBucket: "",
  fiveCentsCdnWasabiEndpoint: "",
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function numberOr(value: unknown, fallback: number, min = 0): number {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) && n >= min ? Math.floor(n) : fallback
}

function portOr(value: unknown, fallback: string | undefined): string | undefined {
  if (value === "") return ""
  if (value === undefined || value === null) return fallback
  const n = Number(value)
  return Number.isFinite(n) && n >= 1 ? String(Math.floor(n)) : fallback
}

function decryptSecret(value: unknown): string {
  return typeof value === "string" && value ? decrypt(value) || "" : ""
}

function backendTypeOr(value: unknown, fallback: StreamingBackendType): StreamingBackendType {
  return value === "nimble" ||
    value === "srs" ||
    value === "nginx_rtmp" ||
    value === "mediamtx" ||
    value === "fivecentscdn"
    ? value
    : fallback
}

function stringArrayOr(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback
  const items = value.map((item) => String(item).trim()).filter(Boolean)
  return items.length > 0 ? items : fallback
}

function criticalBackupProviderOr(value: unknown, fallback: "wasabi"): "wasabi" {
  return value === "wasabi" ? "wasabi" : fallback
}

function normalizeStored(raw: unknown): SrsSettings {
  const data = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Partial<StoredSrsSettings>) : {}
  const defaults = DEFAULT_SRS_SETTINGS
  return {
    backendType: backendTypeOr(data.backendType, defaults.backendType),
    enabled: typeof data.enabled === "boolean" ? data.enabled : defaults.enabled,
    serverName: stringOr(data.serverName, defaults.serverName),
    host: stringOr(data.host, defaults.host),
    apiUrl: stringOr(data.apiUrl, defaults.apiUrl),
    apiKey: decryptSecret(data.apiKeyEncrypted),
    rtmpPort: numberOr(data.rtmpPort, defaults.rtmpPort, 1),
    httpPort: portOr(data.httpPort, defaults.httpPort),
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
    fiveCentsCdnServerId: numberOr(data.fiveCentsCdnServerId, defaults.fiveCentsCdnServerId, 1),
    fiveCentsCdnCodec: stringOr(data.fiveCentsCdnCodec, defaults.fiveCentsCdnCodec),
    fiveCentsCdnProtocols: stringArrayOr(data.fiveCentsCdnProtocols, defaults.fiveCentsCdnProtocols),
    fiveCentsCdnDvrEnabled:
      typeof data.fiveCentsCdnDvrEnabled === "boolean"
        ? data.fiveCentsCdnDvrEnabled
        : defaults.fiveCentsCdnDvrEnabled,
    fiveCentsCdnDvrRetentionDays: numberOr(
      data.fiveCentsCdnDvrRetentionDays,
      defaults.fiveCentsCdnDvrRetentionDays,
      1,
    ),
    fiveCentsCdnCriticalBackupEnabled:
      typeof data.fiveCentsCdnCriticalBackupEnabled === "boolean"
        ? data.fiveCentsCdnCriticalBackupEnabled
        : defaults.fiveCentsCdnCriticalBackupEnabled,
    fiveCentsCdnCriticalBackupProvider: criticalBackupProviderOr(
      data.fiveCentsCdnCriticalBackupProvider,
      defaults.fiveCentsCdnCriticalBackupProvider,
    ),
    fiveCentsCdnCriticalBackupName: stringOr(
      data.fiveCentsCdnCriticalBackupName,
      defaults.fiveCentsCdnCriticalBackupName,
    ),
    fiveCentsCdnCriticalBackupZone: stringOr(
      data.fiveCentsCdnCriticalBackupZone,
      defaults.fiveCentsCdnCriticalBackupZone,
    ),
    fiveCentsCdnWasabiBucket: stringOr(data.fiveCentsCdnWasabiBucket, defaults.fiveCentsCdnWasabiBucket),
    fiveCentsCdnWasabiEndpoint: stringOr(
      data.fiveCentsCdnWasabiEndpoint,
      defaults.fiveCentsCdnWasabiEndpoint,
    ).replace(/\/$/, ""),
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

export async function getStreamingSettings(): Promise<StreamingSettings> {
  return getSrsSettings()
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
    backendType: backendTypeOr(input.backendType, current.backendType),
    enabled: typeof input.enabled === "boolean" ? input.enabled : current.enabled,
    serverName: stringOr(input.serverName, current.serverName),
    host: stringOr(input.host, current.host),
    apiUrl: stringOr(input.apiUrl, current.apiUrl),
    apiKey:
      typeof input.apiKey === "string" && input.apiKey !== SECRET_PLACEHOLDER
        ? input.apiKey.trim()
        : current.apiKey,
    rtmpPort: numberOr(input.rtmpPort, current.rtmpPort, 1),
    httpPort: portOr(input.httpPort, current.httpPort),
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
    fiveCentsCdnServerId: numberOr(input.fiveCentsCdnServerId, current.fiveCentsCdnServerId, 1),
    fiveCentsCdnCodec: stringOr(input.fiveCentsCdnCodec, current.fiveCentsCdnCodec),
    fiveCentsCdnProtocols: stringArrayOr(input.fiveCentsCdnProtocols, current.fiveCentsCdnProtocols),
    fiveCentsCdnDvrEnabled:
      typeof input.fiveCentsCdnDvrEnabled === "boolean"
        ? input.fiveCentsCdnDvrEnabled
        : current.fiveCentsCdnDvrEnabled,
    fiveCentsCdnDvrRetentionDays: numberOr(
      input.fiveCentsCdnDvrRetentionDays,
      current.fiveCentsCdnDvrRetentionDays,
      1,
    ),
    fiveCentsCdnCriticalBackupEnabled:
      typeof input.fiveCentsCdnCriticalBackupEnabled === "boolean"
        ? input.fiveCentsCdnCriticalBackupEnabled
        : current.fiveCentsCdnCriticalBackupEnabled,
    fiveCentsCdnCriticalBackupProvider: criticalBackupProviderOr(
      input.fiveCentsCdnCriticalBackupProvider,
      current.fiveCentsCdnCriticalBackupProvider,
    ),
    fiveCentsCdnCriticalBackupName: stringOr(
      input.fiveCentsCdnCriticalBackupName,
      current.fiveCentsCdnCriticalBackupName,
    ),
    fiveCentsCdnCriticalBackupZone: stringOr(
      input.fiveCentsCdnCriticalBackupZone,
      current.fiveCentsCdnCriticalBackupZone,
    ),
    fiveCentsCdnWasabiBucket: stringOr(input.fiveCentsCdnWasabiBucket, current.fiveCentsCdnWasabiBucket),
    fiveCentsCdnWasabiEndpoint: stringOr(
      input.fiveCentsCdnWasabiEndpoint,
      current.fiveCentsCdnWasabiEndpoint,
    ).replace(/\/$/, ""),
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
  url?: string
  message: string
}> {
  const resolvedSettings = settings ?? await getSrsSettings()
  const result = await fetchSrsApiJson(resolvedSettings, "/api/v1/summaries")
  return {
    ok: result.ok,
    status: result.status,
    url: result.url,
    message: result.message,
  }
}
