/**
 * Nimble Streamer Service - Backward Compatibility Wrapper
 *
 * This file re-exports all streaming functions from the new multi-backend
 * abstraction layer. Existing API routes, components, and hooks that import
 * from "@/lib/nimble-service" will continue to work without changes.
 *
 * The active backend is determined by the STREAMING_BACKEND env var.
 * Default: "nimble". Options: "nimble", "srs", "nginx_rtmp", "mediamtx"
 */

// Re-export all public functions from the abstraction layer
export {
  getNimbleConfig,
  generateStreamKey,
  generatePublishAuth,
  buildRtmpIngestUrl,
  buildHlsPlaybackUrl,
  buildDashPlaybackUrl,
  createStream,
  startStream,
  stopStream,
  getStreamStatus,
  getServerHealth,
  getRecordings,
  getDefaultTranscodingProfiles,
  getActiveProvider,
  getActiveBackendType,
  getProvider,
  BACKEND_INFO,
} from "./streaming"

// Re-export types
export type {
  StreamingBackendType,
  StreamingProvider,
  StreamingBackendInfo,
  CreateStreamOptions,
} from "./streaming"

// ---------------------------------------------------------------------------
// Mock helpers (kept here for backward compat with development mode)
// ---------------------------------------------------------------------------

import type { NimbleStream, NimbleStreamStats } from "./types"
import { evaluateStreamHealth } from "./streaming/nimble-provider"

export { evaluateStreamHealth }

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

// Export the defaultTranscodingProfiles constant for backward compat
import { getDefaultTranscodingProfiles } from "./streaming"
export const defaultTranscodingProfiles = getDefaultTranscodingProfiles()
