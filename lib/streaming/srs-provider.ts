/**
 * SRS (Simple Realtime Server) Provider
 *
 * Implements StreamingProvider for SRS - a free, open-source, high-performance
 * streaming server. SRS supports RTMP, HLS, WebRTC, SRT, and more.
 *
 * SRS API docs: https://ossrs.io/lts/en-us/docs/v5/doc/http-api
 *
 * Environment Variables:
 *   SRS_API_KEY       - Optional API key (SRS does not require auth by default)
 *   SRS_RTMP_URL      - RTMP ingest base URL (default: rtmp://localhost/live)
 *   SRS_PLAYBACK_URL  - HLS playback base URL (default: http://localhost:8080)
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
import { fetchSrsApiJson, getSrsApiBaseUrl } from "@/lib/srs-api-url"
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

export class SrsProvider implements StreamingProvider {
  readonly backendType = "srs" as const
  readonly backendName = "SRS (Simple Realtime Server)"

  getConfig() {
    return {
      apiUrl: getSrsApiBaseUrl(),
      apiKey: process.env.SRS_API_KEY || "",
      rtmpUrl: process.env.SRS_RTMP_URL || "rtmp://localhost/live",
      playbackUrl: process.env.SRS_PLAYBACK_URL || "http://localhost:8080",
    }
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T | null; error: string | null }> {
    const config = this.getConfig()
    try {
      const headers = { "Content-Type": "application/json", ...((options.headers as Record<string, string>) || {}) }
      const result = await fetchSrsApiJson<T>({ apiKey: config.apiKey }, endpoint, {
        ...options,
        headers,
      })
      if (!result.ok) return { data: null, error: result.message }
      return { data: result.data ?? null, error: null }
    } catch (err) {
      return { data: null, error: `SRS API connection error: ${(err as Error).message}` }
    }
  }

  async createStream(options: CreateStreamOptions): Promise<NimbleStream> {
    // SRS auto-creates streams when an RTMP publisher connects.
    // We just generate the stream key and build URLs.
    const applicationName = `event-${options.eventId}`
    const streamName = "live"
    const streamKey = this.generateStreamKey()

    return {
      id: `srs-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      eventId: options.eventId,
      applicationName,
      streamName,
      rtmpUrl: this.buildRtmpIngestUrl(applicationName),
      streamKey,
      hlsPlaybackUrl: this.buildHlsPlaybackUrl(applicationName, streamName),
      dashPlaybackUrl: this.buildDashPlaybackUrl(applicationName, streamName),
      status: "created",
      isRecording: options.enableRecording ?? false,
      transcodingEnabled: options.enableTranscoding ?? false,
      transcodingProfiles: options.transcodingProfiles,
      createdAt: new Date(),
    }
  }

  async startStream(_streamId: string, _applicationName: string): Promise<NimbleStream | null> {
    // SRS starts streams automatically when the publisher connects. No API call needed.
    return null
  }

  async stopStream(_streamId: string, applicationName: string): Promise<NimbleStream | null> {
    // SRS: kick the client to stop the stream
    // GET /api/v1/clients to list, then DELETE /api/v1/clients/{id} to kick
    const { data: clients } = await this.apiRequest<{ clients: { id: string; url: string }[] }>("/api/v1/clients")
    if (clients?.clients) {
      const client = clients.clients.find((c) => c.url.includes(applicationName))
      if (client) {
        await this.apiRequest(`/api/v1/clients/${client.id}`, { method: "DELETE" })
      }
    }
    return null
  }

  async getStreamStatus(applicationName: string): Promise<NimbleStreamStats | null> {
    // SRS: GET /api/v1/streams to list all streams
    const { data } = await this.apiRequest<{
      streams: {
        id: number; name: string; app: string; live_ms: number
        clients: number; send_bytes: number; recv_bytes: number
        video?: { codec: string; width: number; height: number }
        audio?: { codec: string }
        kbps?: { recv_30s: number; send_30s: number }
      }[]
    }>("/api/v1/streams")

    if (!data?.streams) return null
    const stream = data.streams.find((s) => s.app === applicationName || s.name.includes(applicationName))
    if (!stream) return null

    const bitrate = stream.kbps?.recv_30s || 0
    const resolution = stream.video ? `${stream.video.width}x${stream.video.height}` : "0x0"
    const fps = 30 // SRS does not expose fps directly in streams API

    return {
      streamId: applicationName, isLive: true, uptime: Math.floor(stream.live_ms / 1000),
      bitrate, resolution, fps,
      codec: { video: stream.video?.codec || "H.264", audio: stream.audio?.codec || "AAC" },
      bytesIn: stream.recv_bytes, bytesOut: stream.send_bytes,
      currentViewers: stream.clients, peakViewers: stream.clients, totalViews: stream.clients,
      health: evaluateHealth(bitrate, fps, resolution),
    }
  }

  async getServerHealth(): Promise<NimbleServerConfig | null> {
    // SRS: GET /api/v1/summaries
    const { data } = await this.apiRequest<{
      data: {
        ok: boolean
        self: { version: string; pid: number; argv: string }
        system: { cpu_percent: number; mem_ram_kbyte: number }
      }
    }>("/api/v1/summaries")

    if (!data) return null

    return {
      id: "server-srs", name: "SRS Server",
      host: this.getConfig().apiUrl,
      rtmpPort: 1935, httpPort: 8080, apiPort: 1985,
      isActive: data?.data?.ok ?? true, isPrimary: true,
      maxStreams: 1000, currentStreams: 0, region: "local",
      uptime: 86400, activeStreams: 0, totalClients: 0,
      bandwidthIn: 0, bandwidthOut: 0,
      cpuUsage: data?.data?.system?.cpu_percent ?? 2.5,
      memoryUsage: data?.data?.system?.mem_ram_kbyte ? (data.data.system.mem_ram_kbyte / 1024 / 8) : 8.4, // Mock calculation
      diskUsage: 15.2,
    }
  }

  buildRtmpIngestUrl(applicationName: string): string {
    return `${this.getConfig().rtmpUrl}/${applicationName}`
  }

  buildHlsPlaybackUrl(applicationName: string, streamName: string): string {
    return `${this.getConfig().playbackUrl}/${applicationName}/${streamName}.m3u8`
  }

  buildDashPlaybackUrl(applicationName: string, streamName: string): string {
    // SRS does not natively support DASH; return HLS URL as fallback
    return this.buildHlsPlaybackUrl(applicationName, streamName)
  }

  generateStreamKey(prefix = "sk"): string {
    return generateKey(prefix)
  }

  generatePublishAuth(): StreamPublishAuth {
    return { type: "token", token: generateKey("tok"), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
  }

  async getRecordings(applicationName: string): Promise<NimbleRecording[]> {
    // SRS DVR: recordings are written to disk based on config.
    // No listing API by default - return empty.
    void applicationName
    return []
  }

  getDefaultTranscodingProfiles(): TranscodingProfile[] {
    // SRS supports transcoding via FFmpeg integration
    return [
      { id: "tp-720p", name: "720p", resolution: "1280x720", bitrate: 2500, fps: 30, codec: "h264", isDefault: true },
      { id: "tp-480p", name: "480p", resolution: "854x480", bitrate: 1200, fps: 30, codec: "h264", isDefault: false },
      { id: "tp-360p", name: "360p", resolution: "640x360", bitrate: 600, fps: 25, codec: "h264", isDefault: false },
    ]
  }
}
