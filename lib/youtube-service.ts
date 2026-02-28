import type { YouTubeStreamHealth } from "./types"
import { encrypt, decrypt } from "./encryption"
import { getDb, toCamel } from "./db"

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_OAUTH_REVOKE_URL = "https://oauth2.googleapis.com/revoke"

const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ")

/**
 * Get Google OAuth credentials.
 * Reads from platform_settings DB first (admin-configured), then falls back to env vars.
 */
async function getGoogleCredentials(): Promise<{ clientId: string; clientSecret: string }> {
  const sql = getDb()

  // Try DB first (admin-configured via settings UI)
  const rows = await sql`
    SELECT key, value FROM platform_settings
    WHERE key IN ('google_client_id', 'google_client_secret')
  `
  const dbSettings: Record<string, string> = {}
  for (const row of rows as { key: string; value: string }[]) {
    const val = typeof row.value === "string" ? row.value : JSON.stringify(row.value)
    // Strip surrounding quotes if the value was stored as JSON string
    dbSettings[row.key] = val.replace(/^"|"$/g, "")
  }

  const clientId = dbSettings.google_client_id || process.env.GOOGLE_CLIENT_ID
  const clientSecret = dbSettings.google_client_secret || process.env.GOOGLE_CLIENT_SECRET

  if (!clientId) throw new Error("Google Client ID is not configured. Set it in Admin > Settings > Integrations or via GOOGLE_CLIENT_ID environment variable.")
  if (!clientSecret) throw new Error("Google Client Secret is not configured. Set it in Admin > Settings > Integrations or via GOOGLE_CLIENT_SECRET environment variable.")

  return { clientId, clientSecret }
}

function getGoogleClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID
  if (!id) throw new Error("GOOGLE_CLIENT_ID is not set. Configure in Admin > Settings > Integrations.")
  return id
}

function getGoogleClientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET
  if (!secret) throw new Error("GOOGLE_CLIENT_SECRET is not set. Configure in Admin > Settings > Integrations.")
  return secret
}

function getRedirectUri(): string {
  return process.env.YOUTUBE_OAUTH_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/auth/youtube/callback`
}

// ──────────────────────────────────────
// OAuth
// ──────────────────────────────────────

/** Build the Google OAuth consent screen URL */
export async function getYouTubeOAuthUrl(redirectUri: string, state: string): Promise<string> {
  const { clientId } = await getGoogleCredentials()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: YOUTUBE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/** Exchange authorization code for access + refresh tokens */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> {
  const { clientId, clientSecret } = await getGoogleCredentials()
  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Token exchange failed: ${err.error_description || err.error || res.statusText}`)
  }

  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  }
}

/** Refresh an expired access token using the refresh token */
export async function refreshAccessToken(encryptedRefreshToken: string): Promise<{
  accessToken: string
  expiresIn: number
}> {
  const refreshToken = decrypt(encryptedRefreshToken)
  const { clientId, clientSecret } = await getGoogleCredentials()

  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Token refresh failed: ${err.error_description || err.error || res.statusText}`)
  }

  const data = await res.json()
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  }
}

/** Revoke a user's access (disconnect channel) */
export async function revokeAccess(encryptedAccessToken: string): Promise<boolean> {
  const accessToken = decrypt(encryptedAccessToken)
  const res = await fetch(`${GOOGLE_OAUTH_REVOKE_URL}?token=${accessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  })
  return res.ok
}

// ──────────────────────────────────────
// Helper: get a valid access token for a channel (auto-refresh if expired)
// ──────────────────────────────────────

export async function getValidAccessToken(channelDbId: string): Promise<string> {
  const sql = getDb()
  const rows = await sql`
    SELECT encrypted_access_token, encrypted_refresh_token, token_expires_at
    FROM youtube_channels WHERE id = ${channelDbId} AND is_active = true
  `
  if (rows.length === 0) throw new Error("Channel not found or inactive")

  const channel = rows[0]
  const expiresAt = new Date(channel.token_expires_at)

  // If token expires in less than 5 minutes, refresh it
  if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
    const { accessToken, expiresIn } = await refreshAccessToken(channel.encrypted_refresh_token)
    const newEncrypted = encrypt(accessToken)
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000)

    await sql`
      UPDATE youtube_channels
      SET encrypted_access_token = ${newEncrypted}, token_expires_at = ${newExpiresAt.toISOString()}, updated_at = NOW()
      WHERE id = ${channelDbId}
    `
    return accessToken
  }

  return decrypt(channel.encrypted_access_token)
}

// ──────────────────────────────────────
// YouTube Data API v3 -- Channel
// ──────────────────────────────────────

/** Fetch channel info using an access token */
export async function getChannelInfo(accessToken: string): Promise<{
  channelId: string
  channelTitle: string
  channelThumbnail: string
  subscriberCount: number
  videoCount: number
}> {
  const res = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&mine=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Failed to fetch channel info: ${err.error?.message || res.statusText}`)
  }

  const data = await res.json()
  if (!data.items || data.items.length === 0) {
    throw new Error("No YouTube channel found for this account")
  }

  const ch = data.items[0]
  return {
    channelId: ch.id,
    channelTitle: ch.snippet.title,
    channelThumbnail: ch.snippet.thumbnails?.default?.url || "",
    subscriberCount: parseInt(ch.statistics.subscriberCount || "0", 10),
    videoCount: parseInt(ch.statistics.videoCount || "0", 10),
  }
}

// ──────────────────────────────────────
// YouTube Data API v3 -- Broadcasts + Streams
// ──────────────────────────────────────

/** Create a broadcast + stream on YouTube and bind them together */
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
    enableLowLatency?: boolean
  },
): Promise<{
  broadcastId: string
  streamId: string
  rtmpUrl: string
  streamKey: string
}> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }

  // Step 1: Create the broadcast
  const broadcastRes = await fetch(
    `${YOUTUBE_API_BASE}/liveBroadcasts?part=snippet,status,contentDetails`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        snippet: {
          title,
          description,
          scheduledStartTime: scheduledStartTime.toISOString(),
        },
        status: {
          privacyStatus,
          selfDeclaredMadeForKids: false,
        },
        contentDetails: {
          enableDvr: options.enableDvr ?? true,
          enableAutoStart: options.enableAutoStart ?? true,
          enableAutoStop: options.enableAutoStop ?? true,
          latencyPreference: options.enableLowLatency ? "ultraLow" : "normal",
          enableClosedCaptions: false,
        },
      }),
    },
  )

  if (!broadcastRes.ok) {
    const err = await broadcastRes.json().catch(() => ({}))
    throw new Error(`Failed to create broadcast: ${err.error?.message || broadcastRes.statusText}`)
  }

  const broadcast = await broadcastRes.json()

  // Step 2: Create the stream
  const streamRes = await fetch(
    `${YOUTUBE_API_BASE}/liveStreams?part=snippet,cdn`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        snippet: {
          title: `Stream for ${title}`,
        },
        cdn: {
          frameRate: "variable",
          ingestionType: "rtmp",
          resolution: "variable",
        },
      }),
    },
  )

  if (!streamRes.ok) {
    const err = await streamRes.json().catch(() => ({}))
    // Clean up the broadcast if stream creation fails
    await fetch(
      `${YOUTUBE_API_BASE}/liveBroadcasts?id=${broadcast.id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } },
    ).catch(() => {})
    throw new Error(`Failed to create stream: ${err.error?.message || streamRes.statusText}`)
  }

  const stream = await streamRes.json()

  // Step 3: Bind the stream to the broadcast
  const bindRes = await fetch(
    `${YOUTUBE_API_BASE}/liveBroadcasts/bind?id=${broadcast.id}&part=id,contentDetails&streamId=${stream.id}`,
    { method: "POST", headers },
  )

  if (!bindRes.ok) {
    const err = await bindRes.json().catch(() => ({}))
    // Clean up both resources on failure
    await Promise.all([
      fetch(`${YOUTUBE_API_BASE}/liveBroadcasts?id=${broadcast.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => {}),
      fetch(`${YOUTUBE_API_BASE}/liveStreams?id=${stream.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => {}),
    ])
    throw new Error(`Failed to bind stream to broadcast: ${err.error?.message || bindRes.statusText}`)
  }

  return {
    broadcastId: broadcast.id,
    streamId: stream.id,
    rtmpUrl: stream.cdn.ingestionInfo.ingestionAddress,
    streamKey: stream.cdn.ingestionInfo.streamName,
  }
}

/** Transition broadcast status (testing -> live -> complete) */
export async function transitionBroadcast(
  accessToken: string,
  broadcastId: string,
  status: "testing" | "live" | "complete",
): Promise<boolean> {
  const res = await fetch(
    `${YOUTUBE_API_BASE}/liveBroadcasts/transition?broadcastStatus=${status}&id=${broadcastId}&part=status`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const message = err.error?.message || res.statusText

    // YouTube returns specific errors for transition issues
    if (message.includes("redundantTransition")) {
      return true // Already in this status, treat as success
    }
    if (message.includes("liveStreamNotActive")) {
      throw new Error("Stream is not active yet. Please check your encoder is sending data to the RTMP URL.")
    }
    throw new Error(`Failed to transition broadcast: ${message}`)
  }

  return true
}

/** Get the health/status of a live stream */
export async function getStreamHealth(accessToken: string, streamId: string): Promise<YouTubeStreamHealth> {
  const res = await fetch(
    `${YOUTUBE_API_BASE}/liveStreams?part=status&id=${streamId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )

  if (!res.ok) {
    return { status: "noData", lastUpdateTime: new Date(), configurationIssues: [] }
  }

  const data = await res.json()
  if (!data.items || data.items.length === 0) {
    return { status: "noData", lastUpdateTime: new Date(), configurationIssues: [] }
  }

  const streamStatus = data.items[0].status
  const healthStatus = streamStatus?.healthStatus

  // Map YouTube's health status to our simplified status
  let status: YouTubeStreamHealth["status"] = "noData"
  if (healthStatus?.status === "good") status = "good"
  else if (healthStatus?.status === "ok") status = "ok"
  else if (healthStatus?.status === "bad") status = "bad"
  else if (healthStatus?.status === "noData") status = "noData"

  const configurationIssues = (healthStatus?.configurationIssues || []).map(
    (issue: { type: string; description: string }) => issue.description || issue.type,
  )

  return {
    status,
    lastUpdateTime: healthStatus?.lastUpdateTimeSeconds
      ? new Date(parseInt(healthStatus.lastUpdateTimeSeconds, 10) * 1000)
      : new Date(),
    configurationIssues,
  }
}

/** Delete a broadcast from YouTube */
export async function deleteBroadcast(accessToken: string, broadcastId: string): Promise<boolean> {
  const res = await fetch(
    `${YOUTUBE_API_BASE}/liveBroadcasts?id=${broadcastId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Failed to delete broadcast: ${err.error?.message || res.statusText}`)
  }

  return true
}

// ──────────────────────────────────────
// Database helpers for channel management
// ──────────────────────────────────────

/** Save a connected YouTube channel to the database with encrypted tokens */
export async function saveChannel(params: {
  ownerId: string
  ownerType: "admin" | "reseller" | "user"
  channelId: string
  channelTitle: string
  channelThumbnail: string
  subscriberCount: number
  videoCount: number
  accessToken: string
  refreshToken: string
  expiresIn: number
}): Promise<string> {
  const sql = getDb()
  const encryptedAccess = encrypt(params.accessToken)
  const encryptedRefresh = encrypt(params.refreshToken)
  const tokenExpiresAt = new Date(Date.now() + params.expiresIn * 1000)
  const scopes = YOUTUBE_SCOPES

  const rows = await sql`
    INSERT INTO youtube_channels (
      owner_id, owner_type, channel_id, channel_title, channel_thumbnail,
      subscriber_count, video_count,
      encrypted_access_token, encrypted_refresh_token, token_expires_at, scopes
    ) VALUES (
      ${params.ownerId}, ${params.ownerType}, ${params.channelId}, ${params.channelTitle}, ${params.channelThumbnail},
      ${params.subscriberCount}, ${params.videoCount},
      ${encryptedAccess}, ${encryptedRefresh}, ${tokenExpiresAt.toISOString()}, ${scopes}
    )
    ON CONFLICT (owner_id, owner_type, channel_id)
    DO UPDATE SET
      channel_title = EXCLUDED.channel_title,
      channel_thumbnail = EXCLUDED.channel_thumbnail,
      subscriber_count = EXCLUDED.subscriber_count,
      video_count = EXCLUDED.video_count,
      encrypted_access_token = EXCLUDED.encrypted_access_token,
      encrypted_refresh_token = EXCLUDED.encrypted_refresh_token,
      token_expires_at = EXCLUDED.token_expires_at,
      scopes = EXCLUDED.scopes,
      is_active = true,
      updated_at = NOW()
    RETURNING id
  `

  return rows[0].id
}

/** Get all channels for an owner */
export async function getChannelsForOwner(ownerId: string, ownerType: "admin" | "reseller" | "user") {
  const sql = getDb()
  const rows = await sql`
    SELECT id, channel_id, channel_title, channel_thumbnail, subscriber_count, video_count,
           is_active, created_at, updated_at, token_expires_at
    FROM youtube_channels
    WHERE owner_id = ${ownerId} AND owner_type = ${ownerType} AND is_active = true
    ORDER BY created_at DESC
  `
  return rows.map(toCamel)
}

/** Disconnect a channel (soft delete + revoke tokens) */
export async function disconnectChannel(channelDbId: string, ownerId: string, ownerType: string): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    SELECT encrypted_access_token FROM youtube_channels
    WHERE id = ${channelDbId} AND owner_id = ${ownerId} AND owner_type = ${ownerType}
  `

  if (rows.length === 0) return false

  // Revoke the token at Google
  try {
    await revokeAccess(rows[0].encrypted_access_token)
  } catch {
    // Continue even if revocation fails -- still mark inactive locally
  }

  await sql`
    UPDATE youtube_channels SET is_active = false, updated_at = NOW()
    WHERE id = ${channelDbId} AND owner_id = ${ownerId} AND owner_type = ${ownerType}
  `

  return true
}

// ──────────────────────────────────────
// Database helpers for broadcast management
// ──────────────────────────────────────

/** Save a broadcast record to the database */
export async function saveBroadcast(params: {
  eventId: string
  youtubeChannelId: string
  broadcastId: string
  streamId: string
  rtmpUrl: string
  streamKey: string
  privacyStatus: "public" | "unlisted" | "private"
  scheduledStart?: Date
  enableDvr?: boolean
  enableAutoStart?: boolean
  enableAutoStop?: boolean
  enableLowLatency?: boolean
}): Promise<string> {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO youtube_broadcasts (
      event_id, youtube_channel_id, broadcast_id, stream_id,
      rtmp_url, stream_key, privacy_status, scheduled_start,
      enable_dvr, enable_auto_start, enable_auto_stop, enable_low_latency
    ) VALUES (
      ${params.eventId}, ${params.youtubeChannelId}, ${params.broadcastId}, ${params.streamId},
      ${params.rtmpUrl}, ${params.streamKey}, ${params.privacyStatus}, ${params.scheduledStart?.toISOString() || null},
      ${params.enableDvr ?? true}, ${params.enableAutoStart ?? true}, ${params.enableAutoStop ?? true}, ${params.enableLowLatency ?? false}
    )
    RETURNING id
  `
  return rows[0].id
}

/** Get broadcast for an event */
export async function getBroadcastForEvent(eventId: string) {
  const sql = getDb()
  const rows = await sql`
    SELECT b.*, c.channel_title, c.channel_id as yt_channel_id, c.channel_thumbnail
    FROM youtube_broadcasts b
    JOIN youtube_channels c ON b.youtube_channel_id = c.id
    WHERE b.event_id = ${eventId}
    ORDER BY b.created_at DESC LIMIT 1
  `
  return rows.length > 0 ? toCamel(rows[0]) : null
}

/** Update broadcast status in DB */
export async function updateBroadcastStatus(
  broadcastDbId: string,
  status: string,
  extra?: { actualStart?: Date; actualEnd?: Date },
): Promise<void> {
  const sql = getDb()
  if (extra?.actualStart) {
    await sql`
      UPDATE youtube_broadcasts SET broadcast_status = ${status}, actual_start = ${extra.actualStart.toISOString()}, updated_at = NOW()
      WHERE id = ${broadcastDbId}
    `
  } else if (extra?.actualEnd) {
    await sql`
      UPDATE youtube_broadcasts SET broadcast_status = ${status}, actual_end = ${extra.actualEnd.toISOString()}, updated_at = NOW()
      WHERE id = ${broadcastDbId}
    `
  } else {
    await sql`
      UPDATE youtube_broadcasts SET broadcast_status = ${status}, updated_at = NOW()
      WHERE id = ${broadcastDbId}
    `
  }
}
