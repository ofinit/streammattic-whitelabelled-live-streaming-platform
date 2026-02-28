/**
 * @deprecated Use `lib/streaming/index.ts` and the provider abstraction instead.
 * This file contains legacy mock data and will be removed in a future cleanup.
 * New code should import from `@/lib/streaming` which supports all backends
 * (Nimble, SRS, Nginx-RTMP, MediaMTX).
 */
// Mock Nimble Streamer Service for frontend simulation
// In production, this would call the actual NestJS backend API

import type { LiveEvent } from "./types"

export interface StreamConfig {
  applicationName: string
  streamName: string
  publishCredentials?: {
    username: string
    password: string
  }
  recording?: {
    enabled: boolean
    format: "mp4" | "ts"
  }
  transcoding?: {
    enabled: boolean
    profiles: string[]
  }
}

export interface StreamStatus {
  isLive: boolean
  viewers: number
  peakViewers: number
  startTime?: Date
  duration?: number
  bitrate?: number
  resolution?: string
  fps?: number
  health: "excellent" | "good" | "fair" | "poor"
}

export interface StreamUrls {
  rtmpUrl: string
  rtmpStreamKey: string
  hlsUrl: string
  dashUrl: string
  previewUrl?: string
}

export interface StreamRecording {
  id: string
  filename: string
  url: string
  size: number
  duration: number
  createdAt: Date
}

export interface StreamStatistics {
  totalViews: number
  uniqueViewers: number
  averageViewDuration: number
  peakConcurrentViewers: number
  totalBandwidth: number
  viewersByCountry: Record<string, number>
  viewersByDevice: Record<string, number>
  viewerTimeline: Array<{ time: Date; viewers: number }>
}

export interface ServerStats {
  uptime: number
  activeStreams: number
  totalClients: number
  cpuUsage: number
  memoryUsage: number
  bandwidthIn: number
  bandwidthOut: number
  diskUsage: number
}

// Mock streaming service
class StreamingService {
  private readonly serverUrl = "play.rtmplive.net"
  private readonly rtmpPort = 1935

  // Generate unique stream key
  generateStreamKey(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 10)
    return `live_${timestamp}_${random}`
  }

  // Generate publish credentials
  generatePublishCredentials(): { username: string; password: string } {
    return {
      username: `pub_${Math.random().toString(36).substring(2, 10)}`,
      password: Math.random().toString(36).substring(2, 18),
    }
  }

  // Create a new stream
  async createStream(config: StreamConfig): Promise<StreamUrls> {
    const { applicationName, streamName, publishCredentials } = config

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const rtmpUrl = publishCredentials
      ? `rtmp://${publishCredentials.username}:${publishCredentials.password}@${this.serverUrl}:${this.rtmpPort}/${applicationName}`
      : `rtmp://${this.serverUrl}:${this.rtmpPort}/${applicationName}`

    return {
      rtmpUrl,
      rtmpStreamKey: streamName,
      hlsUrl: `https://${this.serverUrl}/${applicationName}/${streamName}/playlist.m3u8`,
      dashUrl: `https://${this.serverUrl}/${applicationName}/${streamName}/manifest.mpd`,
      previewUrl: `https://${this.serverUrl}/${applicationName}/${streamName}/thumbnail.jpg`,
    }
  }

  // Get stream status (mock data)
  async getStreamStatus(event: LiveEvent): Promise<StreamStatus> {
    await new Promise((resolve) => setTimeout(resolve, 200))

    if (event.status !== "live") {
      return {
        isLive: false,
        viewers: 0,
        peakViewers: event.maxViewers,
        health: "good",
      }
    }

    // Simulate varying viewer counts and metrics
    const baseViewers = event.currentViewers
    const variance = Math.floor(Math.random() * 10) - 5
    const currentViewers = Math.max(0, baseViewers + variance)

    return {
      isLive: true,
      viewers: currentViewers,
      peakViewers: Math.max(currentViewers, event.maxViewers),
      startTime: event.startedAt || new Date(),
      duration: event.startedAt ? Math.floor((Date.now() - event.startedAt.getTime()) / 1000) : 0,
      bitrate: 4500 + Math.floor(Math.random() * 1000),
      resolution: "1920x1080",
      fps: 30,
      health: this.calculateHealth(),
    }
  }

  private calculateHealth(): "excellent" | "good" | "fair" | "poor" {
    const rand = Math.random()
    if (rand > 0.7) return "excellent"
    if (rand > 0.3) return "good"
    if (rand > 0.1) return "fair"
    return "poor"
  }

  // Get stream statistics (mock data)
  async getStreamStatistics(eventId: string): Promise<StreamStatistics> {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const now = new Date()
    const timeline = Array.from({ length: 24 }, (_, i) => ({
      time: new Date(now.getTime() - (23 - i) * 3600000),
      viewers: Math.floor(Math.random() * 500) + 50,
    }))

    return {
      totalViews: Math.floor(Math.random() * 10000) + 1000,
      uniqueViewers: Math.floor(Math.random() * 5000) + 500,
      averageViewDuration: Math.floor(Math.random() * 1800) + 300,
      peakConcurrentViewers: Math.floor(Math.random() * 1000) + 100,
      totalBandwidth: Math.floor(Math.random() * 100) + 10,
      viewersByCountry: {
        IN: Math.floor(Math.random() * 3000) + 500,
        US: Math.floor(Math.random() * 1000) + 200,
        GB: Math.floor(Math.random() * 500) + 100,
        CA: Math.floor(Math.random() * 300) + 50,
        AU: Math.floor(Math.random() * 200) + 30,
      },
      viewersByDevice: {
        Desktop: Math.floor(Math.random() * 2000) + 300,
        Mobile: Math.floor(Math.random() * 3000) + 500,
        Tablet: Math.floor(Math.random() * 500) + 50,
        TV: Math.floor(Math.random() * 200) + 20,
      },
      viewerTimeline: timeline,
    }
  }

  // Get recordings for an event (mock data)
  async getRecordings(eventId: string): Promise<StreamRecording[]> {
    await new Promise((resolve) => setTimeout(resolve, 300))

    return [
      {
        id: "rec-1",
        filename: "stream_2024_01_15_part1.mp4",
        url: `https://${this.serverUrl}/recordings/${eventId}/part1.mp4`,
        size: 1024 * 1024 * 850, // 850 MB
        duration: 3600,
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        id: "rec-2",
        filename: "stream_2024_01_15_part2.mp4",
        url: `https://${this.serverUrl}/recordings/${eventId}/part2.mp4`,
        size: 1024 * 1024 * 720,
        duration: 2700,
        createdAt: new Date(Date.now() - 86400000 + 3600000),
      },
    ]
  }

  // Get server statistics (admin only)
  async getServerStats(): Promise<ServerStats> {
    await new Promise((resolve) => setTimeout(resolve, 200))

    return {
      uptime: Math.floor(Math.random() * 30 * 24 * 3600) + 86400,
      activeStreams: Math.floor(Math.random() * 50) + 5,
      totalClients: Math.floor(Math.random() * 2000) + 100,
      cpuUsage: Math.random() * 60 + 10,
      memoryUsage: Math.random() * 50 + 20,
      bandwidthIn: Math.random() * 500 + 50,
      bandwidthOut: Math.random() * 2000 + 200,
      diskUsage: Math.random() * 40 + 30,
    }
  }

  // Check server health
  async healthCheck(): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return Math.random() > 0.05 // 95% chance of healthy
  }

  // Format duration
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  // Format bytes
  formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  // Format bitrate
  formatBitrate(kbps: number): string {
    if (kbps >= 1000) {
      return `${(kbps / 1000).toFixed(1)} Mbps`
    }
    return `${kbps} Kbps`
  }

  // Stop an active stream
  async stopStream(eventId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log(`[StreamingService] Stopping stream for event: ${eventId}`)
    return true
  }

  // Start recording for a stream
  async startRecording(eventId: string, format: "mp4" | "ts" = "mp4"): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    console.log(`[StreamingService] Starting recording for event: ${eventId}, format: ${format}`)
    return true
  }

  // Stop recording for a stream
  async stopRecording(eventId: string): Promise<StreamRecording | null> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log(`[StreamingService] Stopping recording for event: ${eventId}`)
    return {
      id: `rec-${Date.now()}`,
      filename: `recording_${eventId}_${Date.now()}.mp4`,
      url: `https://${this.serverUrl}/recordings/${eventId}/latest.mp4`,
      size: 1024 * 1024 * 500,
      duration: 1800,
      createdAt: new Date(),
    }
  }

  // Delete a recording
  async deleteRecording(recordingId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    console.log(`[StreamingService] Deleting recording: ${recordingId}`)
    return true
  }

  // Get stream by application and stream name
  async getStreamByName(applicationName: string, streamName: string): Promise<StreamStatus | null> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    // Mock: return a stream status
    return {
      isLive: Math.random() > 0.5,
      viewers: Math.floor(Math.random() * 500),
      peakViewers: Math.floor(Math.random() * 1000),
      startTime: new Date(Date.now() - Math.random() * 3600000),
      duration: Math.floor(Math.random() * 3600),
      bitrate: 4500 + Math.floor(Math.random() * 1500),
      resolution: "1920x1080",
      fps: 30,
      health: this.calculateHealth(),
    }
  }

  // Regenerate stream key
  async regenerateStreamKey(eventId: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const newKey = this.generateStreamKey()
    console.log(`[StreamingService] Regenerated stream key for event: ${eventId}`)
    return newKey
  }

  // Get all active streams (admin)
  async getAllActiveStreams(): Promise<Array<{ eventId: string; status: StreamStatus }>> {
    await new Promise((resolve) => setTimeout(resolve, 400))
    // Mock: return some active streams
    return Array.from({ length: Math.floor(Math.random() * 10) + 2 }, (_, i) => ({
      eventId: `event-${i + 1}`,
      status: {
        isLive: true,
        viewers: Math.floor(Math.random() * 500) + 10,
        peakViewers: Math.floor(Math.random() * 1000) + 50,
        startTime: new Date(Date.now() - Math.random() * 7200000),
        duration: Math.floor(Math.random() * 7200),
        bitrate: 4000 + Math.floor(Math.random() * 2000),
        resolution: Math.random() > 0.3 ? "1920x1080" : "1280x720",
        fps: Math.random() > 0.5 ? 30 : 60,
        health: this.calculateHealth(),
      },
    }))
  }

  // Get bandwidth usage for an event
  async getBandwidthUsage(eventId: string): Promise<{ inbound: number; outbound: number }> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return {
      inbound: Math.random() * 10 + 2, // Mbps
      outbound: Math.random() * 100 + 20, // Mbps
    }
  }

  // Check if a stream key is valid/active
  async validateStreamKey(streamKey: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return streamKey.startsWith("live_")
  }
}

export const streamingService = new StreamingService()
