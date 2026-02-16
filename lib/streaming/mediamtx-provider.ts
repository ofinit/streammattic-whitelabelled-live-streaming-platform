/**
 * MediaMTX Provider
 *
 * Implements StreamingProvider for MediaMTX (formerly rtsp-simple-server).
 * Free, open-source, zero-dependency media server supporting RTMP, RTSP,
 * HLS, WebRTC, SRT, and more.
 *
 * MediaMTX API docs: https://github.com/bluenviron/mediamtx#api
 *
 * Environment Variables:
 *   MEDIAMTX_API_URL       - Base URL for MediaMTX API (default: http://localhost:9997)
 *   MEDIAMTX_API_KEY       - Optional API key
 *   MEDIAMTX_RTMP_URL      - RTMP ingest base URL (default: rtmp://localhost:1935)
 *   MEDIAMTX_PLAYBACK_URL  - HLS playback base URL (default: http://localhost:8888)
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
} from "@/lib/types"
import type { StreamingProvider, CreateStreamOptions } from "./types"

function generateKey(prefix = "sk"): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const segments: string[] = []
  for (let s = 0; s < 4; s++) {
    let seg = ""
    for (let i = 0; i < 6; i++) seg += chars.charAt(Math.floor(Math.random() * chars.length))
    segments.push(seg)
  }
  return `${prefix}_${segments.join("-")}`
}

function evaluateHealth(bitrate: number, fps: number, resolution: string): StreamHealth {
  const issues: StreamHealthIssue[] = []
  let score = 100
  if (bitrate < 500) { issues.push({ type: "bitrate", severity: "error", message: "Bitrate critically low" }); score -= 40 }
  else if (bitrate < 1500) { issues.push({ type: "bitrate", severity: "warning", message: "Bitrate low" }); score -= 15 }
  if (fps < 15) { issues.push({ type: "fps", severity: "error", message: "Frame rate critically low" }); score -= 30 }
  else if (fps < 25) { issues.push({ type: "fps", severity: "warning", message: "Frame rate below optimal" }); score -= 10 }
  const height = parseInt(resolution.split("x")[1] || "0")
  if (height < 360) { issues.push({ type: "video", severity: "warning", message: "Low resolution" }); score -= 10 }
  score = Math.max(0, score)
  let status: StreamHealth["status"]
  if (score >= 90) status = "excellent"
  else if (score >= 70) status = "good"
  else if (score >= 50) status = "fair"
  else if (score >= 30) status = "poor"
  else status = "critical"
  return { status, score, issues, lastCheck: new Date() }
}

export class MediaMtxProvider implements StreamingProvider {
  readonly backendType = "mediamtx" as const
  readonly backendName = "MediaMTX"

  getConfig() {
    return {
      apiUrl: process.env.MEDIAMTX_API_URL || "http://localhost:9997",
      apiKey: process.env.MEDIAMTX_API_KEY || "",
      rtmpUrl: process.env.MEDIAMTX_RTMP_URL || "rtmp://localhost:1935",
      playbackUrl: process.env.MEDIAMTX_PLAYBACK_URL || "http://localhost:8888",
    }
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T | null; error: string | null }> {
    const config = this.getConfig()
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`
      const res = await fetch(`${config.apiUrl}${endpoint}`, { ...options, headers: { ...headers, ...((options.headers as Record<string, string>) || {}) } })
      if (!res.ok) return { data: null, error: `MediaMTX API ${res.status}: ${await res.text()}` }
      const data = (await res.json()) as T
      return { data, error: null }
    } catch (err) {
      return { data: null, error: `MediaMTX API connection error: ${(err as Error).message}` }
    }
  }

  async createStream(options: CreateStreamOptions): Promise<NimbleStream> {
    const applicationName = `event-${options.eventId}`
    const streamName = "live"
    const streamKey = this.generateStreamKey()

    // MediaMTX: Create a path configuration via API
    // POST /v3/config/paths/add/{name}
    await this.apiRequest(`/v3/config/paths/add/${applicationName}`, {
      method: "POST",
      body: JSON.stringify({
        name: applicationName,
        source: "publisher",
        record: options.enableRecording ?? false,
      }),
    })

    return {
      id: `mtx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      eventId: options.eventId,
      applicationName,
      streamName,
      rtmpUrl: this.buildRtmpIngestUrl(applicationName),
      streamKey,
      hlsPlaybackUrl: this.buildHlsPlaybackUrl(applicationName, streamName),
      dashPlaybackUrl: this.buildDashPlaybackUrl(applicationName, streamName),
      status: "created",
      isRecording: options.enableRecording ?? false,
      transcodingEnabled: false, // MediaMTX does not do native transcoding
      transcodingProfiles: options.transcodingProfiles,
      createdAt: new Date(),
    }
  }

  async startStream(_streamId: string, _applicationName: string): Promise<NimbleStream | null> {
    // MediaMTX: Streams start when the publisher connects. No API call needed.
    return null
  }

  async stopStream(_streamId: string, applicationName: string): Promise<NimbleStream | null> {
    // MediaMTX: Kick publishers by deleting the path
    // POST /v3/paths/{name}/kick
    // Or remove path config: POST /v3/config/paths/remove/{name}
    await this.apiRequest(`/v3/config/paths/remove/${applicationName}`, { method: "POST" })
    return null
  }

  async getStreamStatus(applicationName: string): Promise<NimbleStreamStats | null> {
    // MediaMTX: GET /v3/paths/get/{name}
    const { data } = await this.apiRequest<{
      name: string
      ready: boolean
      readyTime: string
      tracks: string[]
      bytesReceived: number
      bytesSent: number
      readers: { type: string }[]
    }>(`/v3/paths/get/${applicationName}`)

    if (!data || !data.ready) return null

    const viewers = data.readers?.length || 0
    const bitrate = 2500 // MediaMTX does not expose bitrate directly
    const resolution = "1920x1080" // Not directly exposed

    return {
      streamId: applicationName, isLive: true,
      uptime: data.readyTime ? Math.floor((Date.now() - new Date(data.readyTime).getTime()) / 1000) : 0,
      bitrate, resolution, fps: 30,
      codec: { video: "H.264", audio: "AAC" },
      bytesIn: data.bytesReceived || 0, bytesOut: data.bytesSent || 0,
      currentViewers: viewers, peakViewers: viewers, totalViews: viewers,
      health: evaluateHealth(bitrate, 30, resolution),
    }
  }

  async getServerHealth(): Promise<NimbleServerConfig | null> {
    // MediaMTX: GET /v3/paths/list to check connectivity
    const { error } = await this.apiRequest<{ items: unknown[] }>("/v3/paths/list")

    return {
      id: "server-mediamtx", name: "MediaMTX Server",
      host: this.getConfig().apiUrl,
      rtmpPort: 1935, httpPort: 8888, apiPort: 9997,
      isActive: !error, isPrimary: true,
      maxStreams: 1000, currentStreams: 0, region: "local",
    }
  }

  buildRtmpIngestUrl(applicationName: string): string {
    return `${this.getConfig().rtmpUrl}/${applicationName}`
  }

  buildHlsPlaybackUrl(applicationName: string, _streamName: string): string {
    // MediaMTX serves HLS at /{path}/index.m3u8
    return `${this.getConfig().playbackUrl}/${applicationName}/index.m3u8`
  }

  buildDashPlaybackUrl(applicationName: string, _streamName: string): string {
    // MediaMTX does not natively support DASH; return HLS
    return this.buildHlsPlaybackUrl(applicationName, _streamName)
  }

  generateStreamKey(prefix = "sk"): string {
    return generateKey(prefix)
  }

  generatePublishAuth(): StreamPublishAuth {
    return { type: "token", token: generateKey("tok"), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
  }

  async getRecordings(_applicationName: string): Promise<NimbleRecording[]> {
    // MediaMTX records to disk if configured. No listing API.
    return []
  }

  getDefaultTranscodingProfiles(): TranscodingProfile[] {
    // MediaMTX does not support native transcoding
    return [
      { id: "tp-source", name: "Source (passthrough)", resolution: "original", bitrate: 0, fps: 0, codec: "copy", isDefault: true },
    ]
  }
}
