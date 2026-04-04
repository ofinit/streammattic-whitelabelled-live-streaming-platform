/**
 * Nimble Streamer Provider
 *
 * Implements StreamingProvider for Nimble Streamer (commercial, $50/mo).
 * This is the extracted logic from the original lib/nimble-service.ts.
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
    for (let i = 0; i < 6; i++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segments.push(seg)
  }
  return `${prefix}_${segments.join("-")}`
}

export function evaluateStreamHealth(bitrate: number, fps: number, resolution: string): StreamHealth {
  const issues: StreamHealthIssue[] = []
  let score = 100
  if (bitrate < 500) {
    issues.push({ type: "bitrate", severity: "error", message: "Bitrate critically low (< 500 kbps)" })
    score -= 40
  } else if (bitrate < 1500) {
    issues.push({ type: "bitrate", severity: "warning", message: "Bitrate low (< 1500 kbps)" })
    score -= 15
  }
  if (fps < 15) {
    issues.push({ type: "fps", severity: "error", message: "Frame rate critically low (< 15 fps)" })
    score -= 30
  } else if (fps < 25) {
    issues.push({ type: "fps", severity: "warning", message: "Frame rate below optimal (< 25 fps)" })
    score -= 10
  }
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

export class NimbleProvider implements StreamingProvider {
  readonly backendType = "nimble" as const
  readonly backendName = "Nimble Streamer"

  getConfig() {
    return {
      apiUrl: process.env.NIMBLE_API_URL || "https://nimble-api.streamlivee.com",
      apiKey: process.env.NIMBLE_API_KEY || "",
      rtmpUrl: process.env.NIMBLE_RTMP_URL || "rtmp://stream.streamlivee.com/live",
      playbackUrl: process.env.NIMBLE_PLAYBACK_URL || "https://cdn.streamlivee.com",
    }
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T | null; error: string | null }> {
    const config = this.getConfig()
    if (!config.apiKey) return { data: null, error: null }
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

  async createStream(options: CreateStreamOptions): Promise<NimbleStream> {
    const applicationName = `event-${options.eventId}`
    const streamName = "live"
    const streamKey = this.generateStreamKey()
    const publishAuth = options.publishAuth || this.generatePublishAuth()

    await this.apiRequest("/manage/streams", {
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

    return {
      id: `ns-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      eventId: options.eventId,
      applicationName,
      streamName,
      rtmpUrl: this.buildRtmpIngestUrl(applicationName),
      streamKey,
      hlsPlaybackUrl: this.buildHlsPlaybackUrl(applicationName, streamName),
      dashPlaybackUrl: this.buildDashPlaybackUrl(applicationName, streamName),
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
  }

  async startStream(streamId: string, applicationName: string): Promise<NimbleStream | null> {
    await this.apiRequest(`/manage/streams/${applicationName}/start`, { method: "POST" })
    return null
  }

  async stopStream(streamId: string, applicationName: string): Promise<NimbleStream | null> {
    await this.apiRequest(`/manage/streams/${applicationName}/stop`, { method: "POST" })
    return null
  }

  async getStreamStatus(applicationName: string): Promise<NimbleStreamStats | null> {
    const { data } = await this.apiRequest<{
      is_live: boolean; uptime: number; bitrate: number; resolution: string; fps: number
      codec_video: string; codec_audio: string; bytes_in: number; bytes_out: number
      viewers: number; peak_viewers: number; total_views: number
    }>(`/manage/streams/${applicationName}/status`)

    if (!data) return null
    return {
      streamId: applicationName, isLive: data.is_live, uptime: data.uptime,
      bitrate: data.bitrate, resolution: data.resolution, fps: data.fps,
      codec: { video: data.codec_video, audio: data.codec_audio },
      bytesIn: data.bytes_in, bytesOut: data.bytes_out,
      currentViewers: data.viewers, peakViewers: data.peak_viewers, totalViews: data.total_views,
      health: evaluateStreamHealth(data.bitrate, data.fps, data.resolution),
    }
  }

  async getServerHealth(): Promise<NimbleServerConfig | null> {
    const { data } = await this.apiRequest<{
      name: string; host: string; rtmp_port: number; http_port: number; api_port: number
      is_active: boolean; max_streams: number; current_streams: number; region: string
    }>("/manage/server/status")

    if (!data) {
      return {
        id: "server-primary", name: "Primary Nimble Server", host: this.getConfig().apiUrl,
        rtmpPort: 1935, httpPort: 8080, apiPort: 8082,
        isActive: true, isPrimary: true, maxStreams: 100, currentStreams: 0, region: "ap-south-1",
        uptime: 3600, activeStreams: 0, totalClients: 0,
        bandwidthIn: 0, bandwidthOut: 0, cpuUsage: 5.2, memoryUsage: 12.8, diskUsage: 45.1,
      }
    }
    return {
      id: "server-primary", name: data.name, host: data.host,
      rtmpPort: data.rtmp_port, httpPort: data.http_port, apiPort: data.api_port,
      isActive: data.is_active, isPrimary: true, maxStreams: data.max_streams,
      currentStreams: data.current_streams, region: data.region,
      uptime: 3600, activeStreams: data.current_streams, totalClients: 0,
      bandwidthIn: 0, bandwidthOut: 0, cpuUsage: 5.2, memoryUsage: 12.8, diskUsage: 45.1,
    }
  }

  buildRtmpIngestUrl(applicationName: string): string {
    return `${this.getConfig().rtmpUrl}/${applicationName}`
  }

  buildHlsPlaybackUrl(applicationName: string, streamName: string): string {
    return `${this.getConfig().playbackUrl}/${applicationName}/${streamName}/playlist.m3u8`
  }

  buildDashPlaybackUrl(applicationName: string, streamName: string): string {
    return `${this.getConfig().playbackUrl}/${applicationName}/${streamName}/manifest.mpd`
  }

  generateStreamKey(prefix = "sk"): string {
    return generateKey(prefix)
  }

  generatePublishAuth(): StreamPublishAuth {
    return { type: "token", token: generateKey("tok"), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
  }

  async getRecordings(applicationName: string): Promise<NimbleRecording[]> {
    const { data } = await this.apiRequest<{
      id: string; filename: string; download_url: string; preview_url: string
      size: number; duration: number; format: string; status: string; created_at: string; completed_at: string
    }[]>(`/manage/streams/${applicationName}/recordings`)

    if (!data) return []
    return data.map((r) => ({
      id: r.id, eventId: applicationName.replace("event-", ""), streamId: applicationName,
      filename: r.filename, downloadUrl: r.download_url, previewUrl: r.preview_url,
      size: r.size, duration: r.duration, format: r.format as NimbleRecording["format"],
      status: r.status as NimbleRecording["status"], createdAt: new Date(r.created_at),
      completedAt: r.completed_at ? new Date(r.completed_at) : undefined,
    }))
  }

  getDefaultTranscodingProfiles(): TranscodingProfile[] {
    return [
      { id: "tp-1080p", name: "1080p", resolution: "1920x1080", bitrate: 4500, fps: 30, codec: "h264", isDefault: false },
      { id: "tp-720p", name: "720p", resolution: "1280x720", bitrate: 2500, fps: 30, codec: "h264", isDefault: true },
      { id: "tp-480p", name: "480p", resolution: "854x480", bitrate: 1200, fps: 30, codec: "h264", isDefault: false },
      { id: "tp-360p", name: "360p", resolution: "640x360", bitrate: 600, fps: 25, codec: "h264", isDefault: false },
    ]
  }
}
