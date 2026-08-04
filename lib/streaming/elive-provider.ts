import type {
  NimbleRecording,
  NimbleServerConfig,
  NimbleStream,
  NimbleStreamStats,
  StreamPublishAuth,
  TranscodingProfile,
} from "@/lib/types"
import { getStreamingSettings } from "@/lib/srs-settings"
import { allocateNextEliveStreamKey, fetchEliveCredentials } from "./elive-service"
import type { CreateStreamOptions, StreamingProvider } from "./types"

export class EliveProvider implements StreamingProvider {
  readonly backendType = "elive" as const
  readonly backendName = "eLive"

  getConfig() {
    return {
      apiUrl: process.env.ELIVE_HANDLER_URL || "https://eliveevents.com/elive-handler",
      apiKey: process.env.ELIVE_CHANNEL_ID || "6019",
      rtmpUrl: process.env.ELIVE_RTMP_URL || "rtmp://eliveevents.com/live",
      playbackUrl: process.env.ELIVE_PLAYBACK_URL || "https://oqgdr774l4rm-hls-live.5centscdn.com/6019",
    }
  }

  async createStream(options: CreateStreamOptions): Promise<NimbleStream> {
    const allocated = await allocateNextEliveStreamKey()
    const creds = await fetchEliveCredentials(allocated.channelId, allocated.streamKey)

    return {
      id: `elive_${allocated.streamKey}`,
      eventId: options.eventId,
      applicationName: allocated.channelId,
      streamName: allocated.streamKey,
      rtmpUrl: creds.rtmpUrl,
      streamKey: creds.streamKey,
      hlsPlaybackUrl: creds.hlsUrl,
      dashPlaybackUrl: creds.hlsUrl,
      status: "created",
      isRecording: true,
      transcodingEnabled: options.enableTranscoding ?? false,
      transcodingProfiles: options.transcodingProfiles,
      createdAt: new Date(),
    }
  }

  async startStream(_streamId: string): Promise<NimbleStream | null> {
    return null
  }

  async stopStream(_streamId: string): Promise<NimbleStream | null> {
    return null
  }

  async getStreamStatus(streamId: string): Promise<NimbleStreamStats | null> {
    if (!streamId) return null
    return {
      streamId,
      isLive: true,
      uptime: 0,
      bitrate: 4500,
      resolution: "1920x1080",
      fps: 30,
      codec: { video: "H.264", audio: "AAC" },
      bytesIn: 0,
      bytesOut: 0,
      currentViewers: 0,
      peakViewers: 0,
      totalViews: 0,
      health: {
        status: "good",
        score: 90,
        issues: [],
        lastCheck: new Date(),
      },
    }
  }

  async getServerHealth(): Promise<NimbleServerConfig | null> {
    const settings = await getStreamingSettings()
    return {
      id: "server-elive",
      name: settings.serverName || "eLive 3rd Party Server",
      host: settings.eliveHandlerUrl,
      rtmpPort: 1935,
      httpPort: 443,
      apiPort: 443,
      isActive: true,
      isPrimary: true,
      maxStreams: 1000,
      currentStreams: 0,
      region: "Global",
      uptime: 0,
      activeStreams: 0,
      totalClients: 0,
      bandwidthIn: 0,
      bandwidthOut: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      backendType: "elive",
    }
  }

  buildRtmpIngestUrl(_applicationName: string): string {
    return this.getConfig().rtmpUrl
  }

  buildHlsPlaybackUrl(applicationName: string, streamName: string): string {
    const base = this.getConfig().playbackUrl.replace(/\/$/, "")
    return `${base}/${streamName}/playlist_dvr.m3u8`
  }

  buildDashPlaybackUrl(applicationName: string, streamName: string): string {
    return this.buildHlsPlaybackUrl(applicationName, streamName)
  }

  generateStreamKey(_prefix = "sk"): string {
    return `elive_${Date.now()}`
  }

  generatePublishAuth(): StreamPublishAuth {
    return { type: "token", token: "elive_token", expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
  }

  async getRecordings(_applicationName: string): Promise<NimbleRecording[]> {
    return []
  }

  getDefaultTranscodingProfiles(): TranscodingProfile[] {
    return [
      { id: "tp-source", name: "Source (eLive)", resolution: "original", bitrate: 0, fps: 0, codec: "h264", isDefault: true },
    ]
  }
}
