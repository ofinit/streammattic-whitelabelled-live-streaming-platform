import { randomBytes } from "crypto"
import type { StreamingSettings } from "@/lib/srs-settings"

const DEFAULT_API_BASE_URL = "https://api.5centscdn.com/v2"

export type FiveCentsCdnStreamCredentials = {
  provider: "fivecentscdn"
  providerStreamId: string
  streamName: string
  rtmpUrl: string
  streamKey: string
  hlsUrl: string
  raw: Record<string, unknown>
}

export type FiveCentsCdnProvisioningMetadata = {
  provider: "fivecentscdn"
  streamName: string
  serverId: number
  codec: string
  protocols: string[]
  dvrEnabled: boolean
  dvrRetentionDays: number
}

type FiveCentsCdnRequestOptions = {
  method?: "GET" | "POST" | "DELETE"
  body?: Record<string, unknown>
}

function apiBaseUrl(settings: Pick<StreamingSettings, "apiUrl">): string {
  return (settings.apiUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, "")
}

function assertApiKey(settings: Pick<StreamingSettings, "apiKey">): string {
  const apiKey = settings.apiKey?.trim()
  if (!apiKey) throw new Error("5CentsCDN API key is not configured")
  return apiKey
}

async function requestFiveCentsCdn<T>(
  settings: Pick<StreamingSettings, "apiUrl" | "apiKey">,
  path: string,
  options: FiveCentsCdnRequestOptions = {},
): Promise<T> {
  const res = await fetch(`${apiBaseUrl(settings)}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-API-KEY": assertApiKey(settings),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || (data && typeof data === "object" && (data as Record<string, unknown>).result === "error")) {
    const message =
      typeof (data as Record<string, unknown>).message === "string"
        ? ((data as Record<string, unknown>).message as string)
        : `5CentsCDN request failed with status ${res.status}`
    throw new Error(message)
  }
  return data as T
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function firstRecord(...values: unknown[]): Record<string, unknown> {
  for (const value of values) {
    const record = getRecord(value)
    if (record) return record
  }
  return {}
}

function getString(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return ""
}

function collectStrings(value: unknown, output: string[] = []): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (trimmed) output.push(trimmed)
    return output
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, output))
    return output
  }
  const record = getRecord(value)
  if (record) {
    Object.values(record).forEach((item) => collectStrings(item, output))
  }
  return output
}

function decodeBase64Url(value: string): string {
  try {
    return Buffer.from(value, "base64").toString("utf8").trim()
  } catch {
    return ""
  }
}

function firstHlsUrl(stream: Record<string, unknown>): string {
  const candidates = collectStrings(stream)
  for (const candidate of candidates) {
    if (/^https?:\/\//i.test(candidate) && candidate.includes(".m3u8")) return candidate
    if (/^[a-z0-9+/=]+$/i.test(candidate)) {
      const decoded = decodeBase64Url(candidate)
      if (/^https?:\/\//i.test(decoded) && decoded.includes(".m3u8")) return decoded
    }
  }

  const playbackUrls = getRecord(stream.playbackurls)
  const directHls = getString(playbackUrls?.hls)
  if (directHls) return directHls

  const scheme = getString(playbackUrls?.scheme) || "https"
  const host = candidates.find((candidate) => /-hls-live\.5centscdn\.com$/i.test(candidate))
  const hash = getString(stream.hash)
  const parts = getRecord(stream.parts)
  const pp = getString(parts?.pp)
  const manifest = getString(playbackUrls?.hlsManifest) || "playlist.m3u8"
  if (host && hash && pp) return `${scheme}://${host}/${pp}/${hash}/${manifest}`

  return ""
}

function splitRtmpUrl(rtmp: string, streamName: string): { rtmpUrl: string; streamKey: string } {
  const trimmed = rtmp.trim().replace(/\/+$/, "")
  const parts = streamName.split("/").filter(Boolean)
  const fallbackKey = parts[parts.length - 1] || streamName
  if (!trimmed) return { rtmpUrl: "", streamKey: fallbackKey }

  const slash = trimmed.lastIndexOf("/")
  if (slash <= "rtmp://".length) return { rtmpUrl: trimmed, streamKey: fallbackKey }
  return {
    rtmpUrl: trimmed.slice(0, slash),
    streamKey: trimmed.slice(slash + 1) || fallbackKey,
  }
}

function safeStreamPart(value: string, fallback: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 24)
  const suffix = randomBytes(3).toString("hex")
  const base = normalized.length >= 4 ? normalized : fallback
  return `${base.slice(0, 25)}${suffix}`.slice(0, 32)
}

export function buildFiveCentsCdnStreamName(slug: string): string {
  return `livee/${safeStreamPart(slug, "event")}`
}

export function buildFiveCentsCdnProvisioningMetadata(
  settings: StreamingSettings,
  streamName: string,
): FiveCentsCdnProvisioningMetadata {
  return {
    provider: "fivecentscdn",
    streamName,
    serverId: settings.fiveCentsCdnServerId,
    codec: settings.fiveCentsCdnCodec,
    protocols: [...settings.fiveCentsCdnProtocols],
    dvrEnabled: settings.fiveCentsCdnDvrEnabled,
    dvrRetentionDays: settings.fiveCentsCdnDvrRetentionDays,
  }
}

export function buildFiveCentsCdnProviderPayload(
  stream: FiveCentsCdnStreamCredentials,
  settings: StreamingSettings,
): Record<string, unknown> {
  return {
    response: stream.raw,
    provisioning: buildFiveCentsCdnProvisioningMetadata(settings, stream.streamName),
  }
}

export function getFiveCentsCdnProvisioningMetadata(payload: unknown): FiveCentsCdnProvisioningMetadata | null {
  const provisioning = getRecord(getRecord(payload)?.provisioning)
  if (!provisioning || provisioning.provider !== "fivecentscdn") return null

  const streamName = getString(provisioning.streamName)
  const codec = getString(provisioning.codec)
  const protocols = Array.isArray(provisioning.protocols)
    ? provisioning.protocols.map((item) => String(item).trim()).filter(Boolean)
    : []
  const serverId = Number(provisioning.serverId)
  const dvrRetentionDays = Number(provisioning.dvrRetentionDays)

  if (!streamName || !codec || protocols.length === 0 || !Number.isFinite(serverId)) return null

  return {
    provider: "fivecentscdn",
    streamName,
    serverId,
    codec,
    protocols,
    dvrEnabled: provisioning.dvrEnabled === true,
    dvrRetentionDays: Number.isFinite(dvrRetentionDays) ? dvrRetentionDays : 1,
  }
}

export function isFiveCentsCdnProvisioningCurrent(
  payload: unknown,
  expected: FiveCentsCdnProvisioningMetadata,
): boolean {
  const provisioning = getFiveCentsCdnProvisioningMetadata(payload)
  if (!provisioning) return false

  return (
    provisioning.provider === expected.provider &&
    provisioning.streamName === expected.streamName &&
    provisioning.serverId === expected.serverId &&
    provisioning.codec === expected.codec &&
    JSON.stringify(provisioning.protocols) === JSON.stringify(expected.protocols) &&
    provisioning.dvrEnabled === expected.dvrEnabled &&
    provisioning.dvrRetentionDays === expected.dvrRetentionDays
  )
}

export async function listFiveCentsCdnPushServers(settings: Pick<StreamingSettings, "apiUrl" | "apiKey">) {
  return requestFiveCentsCdn<Record<string, unknown>>(settings, "/streams/push/servers")
}

export async function getFiveCentsCdnPushStream(settings: Pick<StreamingSettings, "apiUrl" | "apiKey">, streamId: string) {
  return requestFiveCentsCdn<Record<string, unknown>>(settings, `/streams/push/${encodeURIComponent(streamId)}`)
}

export async function createFiveCentsCdnPushStream(input: {
  settings: StreamingSettings
  streamName: string
}): Promise<FiveCentsCdnStreamCredentials> {
  const payload = {
    name: input.streamName,
    server: input.settings.fiveCentsCdnServerId,
    codec: input.settings.fiveCentsCdnCodec,
    protocols: input.settings.fiveCentsCdnProtocols,
    _METHOD: "PUT",
    draft: 0,
  }
  const response = await requestFiveCentsCdn<Record<string, unknown>>(input.settings, "/streams/push/new", {
    method: "POST",
    body: payload,
  })
  const data = getRecord(response.data)
  const stream = firstRecord(response.stream, data?.stream, data, response)
  const providerStreamId = getString(stream.id ?? stream.stream_id ?? stream.streamId)
  if (!providerStreamId) throw new Error("5CentsCDN did not return a stream id")

  if (input.settings.fiveCentsCdnDvrEnabled) {
    await updateFiveCentsCdnRecord(input.settings, providerStreamId, {
      enabled: "Y",
      retention: String(input.settings.fiveCentsCdnDvrRetentionDays),
    }).catch((error) => {
      console.warn("[5CentsCDN] Failed to enable DVR:", error)
    })
  }

  const playbackUrls = getRecord(stream.playbackurls) ?? getRecord(stream.playbackUrls)
  const rtmp = getString(playbackUrls?.rtmp ?? stream.rtmp ?? stream.rtmp_url ?? stream.rtmpUrl)
  const credentials = splitRtmpUrl(rtmp, input.streamName)

  return {
    provider: "fivecentscdn",
    providerStreamId,
    streamName: input.streamName,
    rtmpUrl: credentials.rtmpUrl || input.settings.rtmpBaseUrl,
    streamKey: credentials.streamKey,
    hlsUrl: firstHlsUrl(stream),
    raw: response,
  }
}

export async function updateFiveCentsCdnRecord(
  settings: Pick<StreamingSettings, "apiUrl" | "apiKey">,
  streamId: string,
  body: { enabled: "Y" | "N"; retention: string },
) {
  return requestFiveCentsCdn<Record<string, unknown>>(settings, `/streams/push/${encodeURIComponent(streamId)}/record`, {
    method: "POST",
    body,
  })
}

export async function updateFiveCentsCdnRtmpAuth(
  settings: Pick<StreamingSettings, "apiUrl" | "apiKey">,
  streamId: string,
  body: { enabled: "Y" | "N"; username: string; password: string },
) {
  return requestFiveCentsCdn<Record<string, unknown>>(settings, `/streams/push/${encodeURIComponent(streamId)}/rtmpauth`, {
    method: "POST",
    body,
  })
}

export async function updateFiveCentsCdnStreamStatus(
  settings: Pick<StreamingSettings, "apiUrl" | "apiKey">,
  streamId: string,
  body: { disabled: "0" | "1" },
) {
  return requestFiveCentsCdn<Record<string, unknown>>(settings, `/streams/push/${encodeURIComponent(streamId)}/status`, {
    method: "POST",
    body,
  })
}

export async function deleteFiveCentsCdnPushStream(settings: Pick<StreamingSettings, "apiUrl" | "apiKey">, streamId: string) {
  if (!streamId) return null
  return requestFiveCentsCdn<Record<string, unknown>>(settings, `/streams/push/${encodeURIComponent(streamId)}`, {
    method: "DELETE",
  })
}
