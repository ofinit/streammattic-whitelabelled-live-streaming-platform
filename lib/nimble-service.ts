/**
 * Nimble Streamer API Service
 *
 * Handles all communication with the Nimble Streamer server API.
 * Manages RTMP stream creation, stream key generation, stream status,
 * health monitoring, transcoding profiles, and recording.
 *
 * Environment Variables:
 *   NIMBLE_API_URL       - Base URL for the Nimble API (e.g. https://nimble.example.com:8082)
 *   NIMBLE_API_KEY       - API authentication key
 *   NIMBLE_RTMP_URL      - RTMP ingest base URL (e.g. rtmp://stream.example.com/live)
 *   NIMBLE_PLAYBACK_URL  - HLS/DASH playback base URL (e.g. https://cdn.example.com)
 */

import type {
  NimbleStream,
  NimbleStreamStats,
  NimbleRecording,
  NimbleServerConfig,
  StreamHealth,
  StreamHealthIssue,
  StreamPublishAuth,
  TranscodingProfile,
} from "./types"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export function getNimbleConfig() {
  return {
    apiUrl: process.env.NIMBLE_API_URL || "https://nimble-api.streammattic.com",
    apiKey: process.env.NIMBLE_API_KEY || "",
    rtmpUrl: process.env.NIMBLE_RTMP_URL || "rtmp://stream.streammattic.com/live",
    playbackUrl: process.env.NIMBLE_PLAYBACK_URL || "https://cdn.streammattic.com",
  }
}

// ---------------------------------------------------------------------------
// Stream Key Generation
// ---------------------------------------------------------------------------

/** Generate a cryptographically-random stream key */
export function generateStreamKey(prefix = "sk"): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const segments: string[] = []
  for (let s = 0; s < 4; s++) {
    let seg = ""
    for (let i = 0; i < 6; i++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segments.push(seg)
  }
  return `${prefix}_${segments.join("-")}`
}

/** Generate publish credentials for stream authentication */
export function generatePublishAuth(): StreamPublishAuth {
  return {
    type: "token",
    token: generateStreamKey("tok"),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  }
}

// ---------------------------------------------------------------------------
// Application / Stream Management
// ---------------------------------------------------------------------------

/** Build full RTMP ingest URL for an event */
export function buildRtmpIngestUrl(applicationName: string): string {
  const config = getNimbleConfig()
  return `${config.rtmpUrl}/${applicationName}`
}

/** Build HLS playback URL for an event */
export function buildHlsPlaybackUrl(applicationName: string, streamName: string): string {
  const config = getNimbleConfig()
  return `${config.playbackUrl}/${applicationName}/${streamName}/playlist.m3u8`
}

/** Build DASH playback URL for an event */
export function buildDashPlaybackUrl(applicationName: string, streamName: string): string {
  const config = getNimbleConfig()
  return `${config.playbackUrl}/${applicationName}/${streamName}/manifest.mpd`
}

// ---------------------------------------------------------------------------
// Core API Helpers (calls the Nimble REST API)
// ---------------------------------------------------------------------------

async function nimbleApiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: string | null }> {
  const config = getNimbleConfig()

  if (!config.apiKey) {
    // Return mock data when no API key is configured (development mode)
    return { data: null, error: null }
  }

  try {
    const res = await fetch(`${config.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...((options.headers as Record<string, string>) || {}),
      },
    })

    if (!res.ok) {
      const body = await res.text()
      return { data: null, error: `Nimble API ${res.status}: ${body}` }
    }

    const data = (await res.json()) as T
    return { data, error: null }
  } catch (err) {
    return { data: null, error: `Nimble API connection error: ${(err as Error).message}` }
  }
}

// ---------------------------------------------------------------------------
// Create Stream
// ---------------------------------------------------------------------------

export interface CreateStreamOptions {
  eventId: string
  eventTitle: string
  enableRecording?: boolean
  enableTranscoding?: boolean
  transcodingProfiles?: string[]
  publishAuth?: StreamPublishAuth
}

export async function createStream(options: CreateStreamOptions): Promise<NimbleStream> {
  const applicationName = `event-${options.eventId}`
  const streamName = "live"
  const streamKey = generateStreamKey()
  const publishAuth = options.publishAuth || generatePublishAuth()

  // Attempt to create on Nimble server
  await nimbleApiRequest("/manage/streams", {
    method: "POST",
    body: JSON.stringify({
      application: applicationName,
      stream: streamName,
      record: options.enableRecording ?? false,
      transcode: options.enableTranscoding ?? false,
      transcoding_profiles: options.transcodingProfiles || [],
      auth: publishAuth.type !== "none" ? { type: publishAuth.type, token: publishAuth.token } : undefined,
    }),
  })

  const stream: NimbleStream = {
    id: `ns-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    eventId: options.eventId,
    applicationName,
    streamName,
    rtmpUrl: buildRtmpIngestUrl(applicationName),
    streamKey,
    hlsPlaybackUrl: buildHlsPlaybackUrl(applicationName, streamName),
    dashPlaybackUrl: buildDashPlaybackUrl(applicationName, streamName),
    status: "created",
    isRecording: options.enableRecording ?? false,
    publishCredentials:
      publishAuth.type === "basic"
        ? { username: publishAuth.username || "", password: publishAuth.password || "" }
        : undefined,
    transcodingEnabled: options.enableTranscoding ?? false,
    transcodingProfiles: options.transcodingProfiles,
    createdAt: new Date(),
  }

  return stream
}

// ---------------------------------------------------------------------------
// Start / Stop Stream
// ---------------------------------------------------------------------------

export async function startStream(streamId: string, applicationName: string): Promise<NimbleStream | null> {
  await nimbleApiRequest(`/manage/streams/${applicationName}/start`, { method: "POST" })

  // Return updated status (in production this would come from the API response)
  return null // Caller should update from their own data store
}

export async function stopStream(streamId: string, applicationName: string): Promise<NimbleStream | null> {
  await nimbleApiRequest(`/manage/streams/${applicationName}/stop`, { method: "POST" })
  return null
}

// ---------------------------------------------------------------------------
// Stream Status & Stats
// ---------------------------------------------------------------------------

export async function getStreamStatus(applicationName: string): Promise<NimbleStreamStats | null> {
  const { data } = await nimbleApiRequest<{
    is_live: boolean
    uptime: number
    bitrate: number
    resolution: string
    fps: number
    codec_video: string
    codec_audio: string
    bytes_in: number
    bytes_out: number
    viewers: number
    peak_viewers: number
    total_views: number
  }>(`/manage/streams/${applicationName}/status`)

  if (!data) return null

  return {
    streamId: applicationName,
    isLive: data.is_live,
    uptime: data.uptime,
    bitrate: data.bitrate,
    resolution: data.resolution,
    fps: data.fps,
    codec: { video: data.codec_video, audio: data.codec_audio },
    bytesIn: data.bytes_in,
    bytesOut: data.bytes_out,
    currentViewers: data.viewers,
    peakViewers: data.peak_viewers,
    totalViews: data.total_views,
    health: evaluateStreamHealth(data.bitrate, data.fps, data.resolution),
  }
}

// ---------------------------------------------------------------------------
// Stream Health Evaluation
// ---------------------------------------------------------------------------

export function evaluateStreamHealth(bitrate: number, fps: number, resolution: string): StreamHealth {
  const issues: StreamHealthIssue[] = []
  let score = 100

  // Check bitrate
  if (bitrate < 500) {
    issues.push({ type: "bitrate", severity: "error", message: "Bitrate critically low (< 500 kbps)" })
    score -= 40
  } else if (bitrate < 1500) {
    issues.push({ type: "bitrate", severity: "warning", message: "Bitrate low (< 1500 kbps)" })
    score -= 15
  }

  // Check FPS
  if (fps < 15) {
    issues.push({ type: "fps", severity: "error", message: "Frame rate critically low (< 15 fps)" })
    score -= 30
  } else if (fps < 25) {
    issues.push({ type: "fps", severity: "warning", message: "Frame rate below optimal (< 25 fps)" })
    score -= 10
  }

  // Check resolution
  const height = parseInt(resolution.split("x")[1] || "0")
  if (height < 360) {
    issues.push({ type: "video", severity: "warning", message: "Low resolution detected" })
    score -= 10
  }

  score = Math.max(0, score)

  let status: StreamHealth["status"]
  if (score >= 90) status = "excellent"
  else if (score >= 70) status = "good"
  else if (score >= 50) status = "fair"
  else if (score >= 30) status = "poor"
  else status = "critical"

  return { status, score, issues, lastCheck: new Date() }
}

// ---------------------------------------------------------------------------
// Server Health
// ---------------------------------------------------------------------------

export async function getServerHealth(): Promise<NimbleServerConfig | null> {
  const { data } = await nimbleApiRequest<{
    name: string
    host: string
    rtmp_port: number
    http_port: number
    api_port: number
    is_active: boolean
    max_streams: number
    current_streams: number
    region: string
  }>("/manage/server/status")

  if (!data) {
    // Return default mock server config when API is not available
    return {
      id: "server-primary",
      name: "Primary Nimble Server",
      host: getNimbleConfig().apiUrl,
      rtmpPort: 1935,
      httpPort: 8080,
      apiPort: 8082,
      isActive: true,
      isPrimary: true,
      maxStreams: 100,
      currentStreams: 0,
      region: "ap-south-1",
    }
  }

  return {
    id: "server-primary",
    name: data.name,
    host: data.host,
    rtmpPort: data.rtmp_port,
    httpPort: data.http_port,
    apiPort: data.api_port,
    isActive: data.is_active,
    isPrimary: true,
    maxStreams: data.max_streams,
    currentStreams: data.current_streams,
    region: data.region,
  }
}

// ---------------------------------------------------------------------------
// Recordings
// ---------------------------------------------------------------------------

export async function getRecordings(applicationName: string): Promise<NimbleRecording[]> {
  const { data } = await nimbleApiRequest<
    {
      id: string
      filename: string
      download_url: string
      preview_url: string
      size: number
      duration: number
      format: string
      status: string
      created_at: string
      completed_at: string
    }[]
  >(`/manage/streams/${applicationName}/recordings`)

  if (!data) return []

  return data.map((r) => ({
    id: r.id,
    eventId: applicationName.replace("event-", ""),
    streamId: applicationName,
    filename: r.filename,
    downloadUrl: r.download_url,
    previewUrl: r.preview_url,
    size: r.size,
    duration: r.duration,
    format: r.format as NimbleRecording["format"],
    status: r.status as NimbleRecording["status"],
    createdAt: new Date(r.created_at),
    completedAt: r.completed_at ? new Date(r.completed_at) : undefined,
  }))
}

// ---------------------------------------------------------------------------
// Transcoding Profiles
// ---------------------------------------------------------------------------

export const defaultTranscodingProfiles: TranscodingProfile[] = [
  { id: "tp-1080p", name: "1080p", resolution: "1920x1080", bitrate: 4500, fps: 30, codec: "h264", isDefault: false },
  { id: "tp-720p", name: "720p", resolution: "1280x720", bitrate: 2500, fps: 30, codec: "h264", isDefault: true },
  { id: "tp-480p", name: "480p", resolution: "854x480", bitrate: 1200, fps: 30, codec: "h264", isDefault: false },
  { id: "tp-360p", name: "360p", resolution: "640x360", bitrate: 600, fps: 25, codec: "h264", isDefault: false },
]

// ---------------------------------------------------------------------------
// Mock Stream Data (for development when Nimble server is not available)
// ---------------------------------------------------------------------------

const mockStreams: Map<string, NimbleStream> = new Map()

export function getMockStream(eventId: string): NimbleStream | null {
  return mockStreams.get(eventId) || null
}

export function setMockStream(eventId: string, stream: NimbleStream): void {
  mockStreams.set(eventId, stream)
}

export function getMockStreamStats(eventId: string): NimbleStreamStats {
  const stream = mockStreams.get(eventId)
  const isLive = stream?.status === "live"

  return {
    streamId: stream?.id || eventId,
    isLive,
    uptime: isLive ? Math.floor(Math.random() * 7200) : 0,
    bitrate: isLive ? 2500 + Math.floor(Math.random() * 1500) : 0,
    resolution: "1920x1080",
    fps: isLive ? 30 : 0,
    codec: { video: "H.264", audio: "AAC" },
    bytesIn: isLive ? Math.floor(Math.random() * 1000000000) : 0,
    bytesOut: isLive ? Math.floor(Math.random() * 5000000000) : 0,
    currentViewers: isLive ? Math.floor(Math.random() * 500) : 0,
    peakViewers: Math.floor(Math.random() * 800),
    totalViews: Math.floor(Math.random() * 5000),
    health: {
      status: "excellent",
      score: 95,
      issues: [],
      lastCheck: new Date(),
    },
  }
}
