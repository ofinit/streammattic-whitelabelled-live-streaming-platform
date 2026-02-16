/**
 * Streaming Provider Abstraction Layer
 *
 * Defines a common interface that all streaming backends must implement.
 * This allows swapping between Nimble Streamer ($50/mo), SRS (free),
 * Nginx-RTMP (free), and MediaMTX (free) without changing any UI or API route code.
 */

import type {
  NimbleStream,
  NimbleStreamStats,
  NimbleRecording,
  NimbleServerConfig,
  StreamPublishAuth,
  TranscodingProfile,
} from "@/lib/types"

// Re-export these types under generic names for provider use
export type Stream = NimbleStream
export type StreamStats = NimbleStreamStats
export type Recording = NimbleRecording
export type ServerConfig = NimbleServerConfig

export type StreamingBackendType = "nimble" | "srs" | "nginx_rtmp" | "mediamtx"

export interface StreamingBackendInfo {
  type: StreamingBackendType
  name: string
  description: string
  isFree: boolean
  cost: string
  website: string
  features: string[]
  defaultPorts: {
    rtmp: number
    http: number
    api: number
  }
  envVars: {
    apiUrl: string
    apiKey: string
    rtmpUrl: string
    playbackUrl: string
  }
}

export interface CreateStreamOptions {
  eventId: string
  eventTitle: string
  enableRecording?: boolean
  enableTranscoding?: boolean
  transcodingProfiles?: string[]
  publishAuth?: StreamPublishAuth
}

/**
 * Common interface that all streaming backends implement.
 * The factory in index.ts picks the right provider based on config.
 */
export interface StreamingProvider {
  readonly backendType: StreamingBackendType
  readonly backendName: string

  // Config
  getConfig(): {
    apiUrl: string
    apiKey: string
    rtmpUrl: string
    playbackUrl: string
  }

  // Stream lifecycle
  createStream(options: CreateStreamOptions): Promise<Stream>
  startStream(streamId: string, applicationName: string): Promise<Stream | null>
  stopStream(streamId: string, applicationName: string): Promise<Stream | null>

  // Status & stats
  getStreamStatus(applicationName: string): Promise<StreamStats | null>
  getServerHealth(): Promise<ServerConfig | null>

  // URL builders
  buildRtmpIngestUrl(applicationName: string): string
  buildHlsPlaybackUrl(applicationName: string, streamName: string): string
  buildDashPlaybackUrl(applicationName: string, streamName: string): string

  // Keys & auth
  generateStreamKey(prefix?: string): string
  generatePublishAuth(): StreamPublishAuth

  // Recordings
  getRecordings(applicationName: string): Promise<Recording[]>

  // Transcoding
  getDefaultTranscodingProfiles(): TranscodingProfile[]
}

/**
 * Metadata for each supported backend (for the admin UI selector)
 */
export const BACKEND_INFO: Record<StreamingBackendType, StreamingBackendInfo> = {
  nimble: {
    type: "nimble",
    name: "Nimble Streamer",
    description: "Full-featured commercial streaming server by Softvelum with WMSPanel cloud management.",
    isFree: false,
    cost: "$50/month per instance",
    website: "https://wmspanel.com/nimble",
    features: [
      "RTMP, SRT, WebRTC, NDI ingest",
      "HLS, MPEG-DASH, SLDP output",
      "WMSPanel cloud management",
      "Built-in transcoding",
      "DVR & recording",
      "Hotlink protection",
      "Geo-restriction",
    ],
    defaultPorts: { rtmp: 1935, http: 8080, api: 8082 },
    envVars: {
      apiUrl: "NIMBLE_API_URL",
      apiKey: "NIMBLE_API_KEY",
      rtmpUrl: "NIMBLE_RTMP_URL",
      playbackUrl: "NIMBLE_PLAYBACK_URL",
    },
  },
  srs: {
    type: "srs",
    name: "SRS (Simple Realtime Server)",
    description: "Free, open-source, high-performance streaming server. Supports RTMP, HLS, WebRTC, SRT, and GB28181.",
    isFree: true,
    cost: "Free (open-source, MIT license)",
    website: "https://ossrs.io",
    features: [
      "RTMP, SRT, WebRTC ingest",
      "HLS, HTTP-FLV, WebRTC output",
      "Built-in HTTP API",
      "DVR recording",
      "Edge cluster support",
      "Docker-ready deployment",
      "Active community & docs",
    ],
    defaultPorts: { rtmp: 1935, http: 8080, api: 1985 },
    envVars: {
      apiUrl: "SRS_API_URL",
      apiKey: "SRS_API_KEY",
      rtmpUrl: "SRS_RTMP_URL",
      playbackUrl: "SRS_PLAYBACK_URL",
    },
  },
  nginx_rtmp: {
    type: "nginx_rtmp",
    name: "Nginx-RTMP",
    description: "Free, lightweight RTMP module for Nginx. Converts RTMP to HLS/DASH. Minimal resource usage.",
    isFree: true,
    cost: "Free (open-source, BSD license)",
    website: "https://github.com/arut/nginx-rtmp-module",
    features: [
      "RTMP ingest",
      "HLS, MPEG-DASH output",
      "Recording to FLV",
      "Relay & push support",
      "on_publish/on_done callbacks",
      "Extremely lightweight",
      "Battle-tested in production",
    ],
    defaultPorts: { rtmp: 1935, http: 8080, api: 8080 },
    envVars: {
      apiUrl: "NGINX_RTMP_STAT_URL",
      apiKey: "NGINX_RTMP_API_KEY",
      rtmpUrl: "NGINX_RTMP_URL",
      playbackUrl: "NGINX_RTMP_PLAYBACK_URL",
    },
  },
  mediamtx: {
    type: "mediamtx",
    name: "MediaMTX",
    description: "Free, zero-dependency media server. Supports RTMP, RTSP, HLS, WebRTC, SRT, and more protocols.",
    isFree: true,
    cost: "Free (open-source, MIT license)",
    website: "https://github.com/bluenviron/mediamtx",
    features: [
      "RTMP, RTSP, SRT, WebRTC ingest",
      "HLS, WebRTC, RTSP output",
      "Built-in REST API",
      "Recording support",
      "Authentication hooks",
      "Single binary, zero dependencies",
      "Low resource usage",
    ],
    defaultPorts: { rtmp: 1935, http: 8888, api: 9997 },
    envVars: {
      apiUrl: "MEDIAMTX_API_URL",
      apiKey: "MEDIAMTX_API_KEY",
      rtmpUrl: "MEDIAMTX_RTMP_URL",
      playbackUrl: "MEDIAMTX_PLAYBACK_URL",
    },
  },
}
