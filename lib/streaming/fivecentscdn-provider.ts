import { randomBytes } from "crypto"
import type {
  NimbleRecording,
  NimbleServerConfig,
  NimbleStream,
  NimbleStreamStats,
  StreamPublishAuth,
  TranscodingProfile,
} from "@/lib/types"
import { getStreamingSettings } from "@/lib/srs-settings"
import {
  buildFiveCentsCdnStreamName,
  createFiveCentsCdnPushStream,
  getFiveCentsCdnPushStream,
  listFiveCentsCdnPushServers,
  updateFiveCentsCdnStreamStatus,
} from "./fivecentscdn-service"
import type { CreateStreamOptions, StreamingProvider } from "./types"

function token(prefix: string): string {
  return `${prefix}_${randomBytes(18).toString("base64url")}`
}

function envConfig() {
  return {
    apiUrl: process.env.FIVECENTSCDN_API_URL || "https://api.5centscdn.com/v2",
    apiKey: process.env.FIVECENTSCDN_API_KEY || "",
    rtmpUrl: process.env.FIVECENTSCDN_RTMP_URL || "rtmp://rtmp.5centscdn.com:1935",
    playbackUrl: process.env.FIVECENTSCDN_PLAYBACK_URL || "",
  }
}

function asNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export class FiveCentsCdnProvider implements StreamingProvider {
  readonly backendType = "fivecentscdn" as const
  readonly backendName = "5CentsCDN"

  getConfig() {
    return envConfig()
  }

  async createStream(options: CreateStreamOptions): Promise<NimbleStream> {
    const settings = await getStreamingSettings()
    const stream = await createFiveCentsCdnPushStream({
      settings,
      streamName: buildFiveCentsCdnStreamName(options.eventId || options.eventTitle),
    })

    return {
      id: stream.providerStreamId,
      eventId: options.eventId,
      applicationName: stream.providerStreamId,
      streamName: stream.streamName,
      rtmpUrl: stream.rtmpUrl,
      streamKey: stream.streamKey,
      hlsPlaybackUrl: stream.hlsUrl,
      dashPlaybackUrl: stream.hlsUrl,
      status: "created",
      isRecording: settings.fiveCentsCdnDvrEnabled,
      transcodingEnabled: options.enableTranscoding ?? false,
      transcodingProfiles: options.transcodingProfiles,
      createdAt: new Date(),
    }
  }

  async startStream(streamId: string): Promise<NimbleStream | null> {
    const settings = await getStreamingSettings()
    await updateFiveCentsCdnStreamStatus(settings, streamId, { disabled: "0" })
    return null
  }

  async stopStream(streamId: string): Promise<NimbleStream | null> {
    const settings = await getStreamingSettings()
    await updateFiveCentsCdnStreamStatus(settings, streamId, { disabled: "1" })
    return null
  }

  async getStreamStatus(streamId: string): Promise<NimbleStreamStats | null> {
    if (!streamId) return null
    const settings = await getStreamingSettings()
    const response = await getFiveCentsCdnPushStream(settings, streamId)
    const stream = response.stream && typeof response.stream === "object"
      ? response.stream as Record<string, unknown>
      : response

    const viewers = asNumber(stream.viewers ?? stream.clients ?? stream.current_viewers)
    const bitrate = asNumber(stream.bitrate ?? stream.bandwidth)

    return {
      streamId,
      isLive: String(stream.status ?? stream.state ?? "").toLowerCase() === "live",
      uptime: asNumber(stream.uptime ?? stream.live_ms) / (stream.live_ms ? 1000 : 1),
      bitrate,
      resolution: typeof stream.resolution === "string" ? stream.resolution : "0x0",
      fps: asNumber(stream.fps),
      codec: {
        video: typeof stream.codec === "string" ? stream.codec : "H.264",
        audio: "AAC",
      },
      bytesIn: asNumber(stream.bytes_in ?? stream.recv_bytes),
      bytesOut: asNumber(stream.bytes_out ?? stream.send_bytes),
      currentViewers: viewers,
      peakViewers: asNumber(stream.peak_viewers ?? viewers),
      totalViews: asNumber(stream.total_views ?? viewers),
      health: {
        status: "good",
        score: bitrate > 0 ? 90 : 70,
        issues: [],
        lastCheck: new Date(),
      },
    }
  }

  async getServerHealth(): Promise<NimbleServerConfig | null> {
    const settings = await getStreamingSettings()
    await listFiveCentsCdnPushServers(settings)

    return {
      id: "server-fivecentscdn",
      name: settings.serverName || "5CentsCDN",
      host: settings.apiUrl,
      rtmpPort: settings.rtmpPort,
      httpPort: 443,
      apiPort: 443,
      isActive: true,
      isPrimary: true,
      maxStreams: 1000,
      currentStreams: 0,
      region: "5CentsCDN",
      uptime: 0,
      activeStreams: 0,
      totalClients: 0,
      bandwidthIn: 0,
      bandwidthOut: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      backendType: "fivecentscdn",
    }
  }

  buildRtmpIngestUrl(applicationName: string): string {
    return `${this.getConfig().rtmpUrl.replace(/\/$/, "")}/${applicationName}`
  }

  buildHlsPlaybackUrl(applicationName: string, streamName: string): string {
    const base = this.getConfig().playbackUrl.replace(/\/$/, "")
    return base ? `${base}/${applicationName}/${streamName}.m3u8` : ""
  }

  buildDashPlaybackUrl(applicationName: string, streamName: string): string {
    return this.buildHlsPlaybackUrl(applicationName, streamName)
  }

  generateStreamKey(prefix = "sk"): string {
    return token(prefix)
  }

  generatePublishAuth(): StreamPublishAuth {
    return { type: "token", token: token("tok"), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
  }

  async getRecordings(_applicationName: string): Promise<NimbleRecording[]> {
    return []
  }

  getDefaultTranscodingProfiles(): TranscodingProfile[] {
    return [
      { id: "tp-source", name: "Source (5CentsCDN)", resolution: "original", bitrate: 0, fps: 0, codec: "h264", isDefault: true },
    ]
  }
}
