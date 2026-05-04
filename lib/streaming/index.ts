/**
 * Streaming Provider Registry
 *
 * Factory that returns the correct StreamingProvider implementation
 * based on the STREAMING_BACKEND environment variable.
 *
 * Supported backends:
 *   - "nimble"     - Nimble Streamer ($50/month, full-featured)
 *   - "srs"        - SRS Simple Realtime Server (free, open-source)
 *   - "nginx_rtmp" - Nginx-RTMP module (free, open-source)
 *   - "mediamtx"   - MediaMTX (free, open-source)
 *   - "fivecentscdn" - 5CentsCDN managed RTMP/CDN provider
 *
 * Default: "nimble" (for backward compatibility)
 */

import type { StreamingBackendType, StreamingProvider } from "./types"
import { NimbleProvider } from "./nimble-provider"
import { SrsProvider } from "./srs-provider"
import { NginxRtmpProvider } from "./nginx-rtmp-provider"
import { MediaMtxProvider } from "./mediamtx-provider"
import { FiveCentsCdnProvider } from "./fivecentscdn-provider"

// Singleton instances (created once, reused across requests)
const providers: Partial<Record<StreamingBackendType, StreamingProvider>> = {}

/**
 * Get the active streaming backend type from environment.
 */
export function getActiveBackendType(): StreamingBackendType {
  const env = (process.env.STREAMING_BACKEND || "nimble").toLowerCase()
  const valid: StreamingBackendType[] = ["nimble", "srs", "nginx_rtmp", "mediamtx", "fivecentscdn"]
  return valid.includes(env as StreamingBackendType) ? (env as StreamingBackendType) : "nimble"
}

/**
 * Get a StreamingProvider instance for a specific backend.
 */
export function getProvider(backend?: StreamingBackendType): StreamingProvider {
  const type = backend || getActiveBackendType()

  if (!providers[type]) {
    switch (type) {
      case "srs":
        providers[type] = new SrsProvider()
        break
      case "nginx_rtmp":
        providers[type] = new NginxRtmpProvider()
        break
      case "mediamtx":
        providers[type] = new MediaMtxProvider()
        break
      case "fivecentscdn":
        providers[type] = new FiveCentsCdnProvider()
        break
      case "nimble":
      default:
        providers[type] = new NimbleProvider()
        break
    }
  }

  return providers[type]!
}

/**
 * Get the active provider (shorthand for getProvider() with no args).
 */
export function getActiveProvider(): StreamingProvider {
  return getProvider()
}

// ---------------------------------------------------------------------------
// Re-export convenience functions that use the active provider.
// These match the function signatures from the original nimble-service.ts
// so existing API routes and components work without modification.
// ---------------------------------------------------------------------------

export function getNimbleConfig() {
  return getActiveProvider().getConfig()
}

export function generateStreamKey(prefix = "sk"): string {
  return getActiveProvider().generateStreamKey(prefix)
}

export function generatePublishAuth() {
  return getActiveProvider().generatePublishAuth()
}

export function buildRtmpIngestUrl(applicationName: string): string {
  return getActiveProvider().buildRtmpIngestUrl(applicationName)
}

export function buildHlsPlaybackUrl(applicationName: string, streamName: string): string {
  return getActiveProvider().buildHlsPlaybackUrl(applicationName, streamName)
}

export function buildDashPlaybackUrl(applicationName: string, streamName: string): string {
  return getActiveProvider().buildDashPlaybackUrl(applicationName, streamName)
}

export async function createStream(options: Parameters<StreamingProvider["createStream"]>[0]) {
  return getActiveProvider().createStream(options)
}

export async function startStream(streamId: string, applicationName: string) {
  return getActiveProvider().startStream(streamId, applicationName)
}

export async function stopStream(streamId: string, applicationName: string) {
  return getActiveProvider().stopStream(streamId, applicationName)
}

export async function getStreamStatus(applicationName: string) {
  return getActiveProvider().getStreamStatus(applicationName)
}

export async function getServerHealth() {
  return getActiveProvider().getServerHealth()
}

export async function getRecordings(applicationName: string) {
  return getActiveProvider().getRecordings(applicationName)
}

export function getDefaultTranscodingProfiles() {
  return getActiveProvider().getDefaultTranscodingProfiles()
}

// Re-export types
export type { StreamingBackendType, StreamingProvider, StreamingBackendInfo, CreateStreamOptions } from "./types"
export { BACKEND_INFO } from "./types"
