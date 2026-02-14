import type { YouTubeStreamHealth } from "./types"

// Mock YouTube OAuth URL generator
export function getYouTubeOAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "mock-client-id"
  const scopes = [
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/youtube.readonly",
  ].join(" ")

  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${state}`
}

// Mock exchange code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> {
  // In production, this would call Google OAuth API
  await new Promise((r) => setTimeout(r, 1000))
  return {
    accessToken: `ya29.mock_access_token_${Date.now()}`,
    refreshToken: `1//mock_refresh_token_${Date.now()}`,
    expiresIn: 3600,
  }
}

// Mock get channel info from access token
export async function getChannelInfo(accessToken: string): Promise<{
  channelId: string
  channelTitle: string
  channelThumbnail: string
}> {
  await new Promise((r) => setTimeout(r, 500))
  // Simulated channel data
  const channels = [
    {
      channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
      channelTitle: "Google Developers",
      channelThumbnail: "/google-developers-logo.jpg",
    },
    {
      channelId: "UCVHFbqXqoYvEWM1Ddxl0QDg",
      channelTitle: "Tech Reviews",
      channelThumbnail: "/tech-channel-logo.png",
    },
    {
      channelId: "UCBcRF18a7Qf58cCRy5xuWwQ",
      channelTitle: "Gaming Live",
      channelThumbnail: "/gaming-channel-logo.jpg",
    },
  ]
  return channels[Math.floor(Math.random() * channels.length)]
}

// Mock create live broadcast
export async function createLiveBroadcast(
  accessToken: string,
  title: string,
  description: string,
  scheduledStartTime: Date,
  privacyStatus: "public" | "unlisted" | "private",
  options: {
    enableDvr?: boolean
    enableAutoStart?: boolean
    enableAutoStop?: boolean
  },
): Promise<{
  broadcastId: string
  streamId: string
  rtmpUrl: string
  streamKey: string
}> {
  await new Promise((r) => setTimeout(r, 1500))

  const broadcastId = `broadcast_${Math.random().toString(36).substring(2, 15)}`
  const streamId = `stream_${Math.random().toString(36).substring(2, 15)}`
  const streamKey = `${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`

  return {
    broadcastId,
    streamId,
    rtmpUrl: "rtmp://a.rtmp.youtube.com/live2",
    streamKey,
  }
}

// Mock transition broadcast status
export async function transitionBroadcast(
  accessToken: string,
  broadcastId: string,
  status: "testing" | "live" | "complete",
): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 1000))
  return true
}

// Mock get stream health
export async function getStreamHealth(accessToken: string, streamId: string): Promise<YouTubeStreamHealth> {
  await new Promise((r) => setTimeout(r, 500))
  const statuses: YouTubeStreamHealth["status"][] = ["good", "ok", "bad", "noData"]
  return {
    status: statuses[Math.floor(Math.random() * 2)], // Mostly good/ok
    lastUpdateTime: new Date(),
    configurationIssues: [],
  }
}

// Mock refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string
  expiresIn: number
}> {
  await new Promise((r) => setTimeout(r, 500))
  return {
    accessToken: `ya29.refreshed_token_${Date.now()}`,
    expiresIn: 3600,
  }
}

// Mock delete broadcast
export async function deleteBroadcast(accessToken: string, broadcastId: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 500))
  return true
}

// Mock disconnect channel (revoke access)
export async function revokeAccess(accessToken: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 500))
  return true
}
