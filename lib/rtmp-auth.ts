import { createHash, randomBytes } from "crypto"
import { getDb } from "@/lib/db"
import { getSrsSettings } from "@/lib/srs-settings"

type Sql = ReturnType<typeof getDb>

export type RtmpTokenResult = {
  token: string
  tokenHash: string
  streamId: string
  streamKey: string
  rtmpUrl: string
  expiresAt: string
}

export function hashRtmpToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function generateRtmpToken(): string {
  return randomBytes(32).toString("base64url")
}

export function buildRtmpStreamId(eventSlugOrId: string, eventDateId?: string | null): string {
  const base = eventSlugOrId.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
  return eventDateId ? `${base}-date-${eventDateId}` : base
}

export function buildRtmpStreamKey(streamId: string, token: string): string {
  return `${streamId}?token=${encodeURIComponent(token)}`
}

export function extractTokenFromSrsParam(param: unknown): string {
  const raw = typeof param === "string" ? param.trim() : ""
  if (!raw) return ""
  const normalized = raw.startsWith("?") ? raw.slice(1) : raw
  return new URLSearchParams(normalized).get("token")?.trim() || ""
}

export async function createRtmpTokenForStream(input: {
  sql?: Sql
  userId: string
  eventId?: string | null
  eventDateId?: string | null
  streamId: string
  expiresInSeconds?: number
  updateCredentialTarget?: boolean
}): Promise<RtmpTokenResult> {
  const sql = input.sql ?? getDb()
  const settings = await getSrsSettings()
  const token = generateRtmpToken()
  const tokenHash = hashRtmpToken(token)
  const expiresAt = new Date(Date.now() + (input.expiresInSeconds ?? settings.tokenExpirySeconds) * 1000).toISOString()
  const streamKey = buildRtmpStreamKey(input.streamId, token)

  await sql`
    UPDATE stream_tokens
    SET is_active = false, revoked_at = NOW()
    WHERE stream_id = ${input.streamId} AND is_active = true
  `
  await sql`
    INSERT INTO stream_tokens (
      user_id, event_id, event_date_id, stream_id, token_hash, token_hint, expires_at, is_active
    ) VALUES (
      ${input.userId}, ${input.eventId ?? null}, ${input.eventDateId ?? null}, ${input.streamId},
      ${tokenHash}, ${token.slice(-6)}, ${expiresAt}, true
    )
  `

  if (input.updateCredentialTarget && input.eventDateId) {
    await sql`
      UPDATE event_dates
      SET stream_key = ${streamKey}, rtmp_url = ${settings.rtmpBaseUrl}
      WHERE id = ${input.eventDateId}
    `
  } else if (input.updateCredentialTarget && input.eventId) {
    await sql`
      UPDATE events
      SET stream_key = ${streamKey}, rtmp_url = ${settings.rtmpBaseUrl}
      WHERE id = ${input.eventId}
    `
  }

  return {
    token,
    tokenHash,
    streamId: input.streamId,
    streamKey,
    rtmpUrl: settings.rtmpBaseUrl,
    expiresAt,
  }
}

export async function ensureRtmpTokenForStream(input: {
  sql?: Sql
  userId: string
  eventId?: string | null
  eventDateId?: string | null
  streamId: string
  currentStreamKey?: string | null
  updateCredentialTarget?: boolean
}): Promise<RtmpTokenResult> {
  const currentKey = input.currentStreamKey || ""
  const currentStreamId = currentKey.split("?")[0]
  const currentToken = currentKey.includes("?") ? new URLSearchParams(currentKey.slice(currentKey.indexOf("?") + 1)).get("token") || "" : ""
  if (currentStreamId === input.streamId && currentToken) {
    const existing = await findValidRtmpToken({ sql: input.sql, streamId: input.streamId, token: currentToken })
    if (existing) {
      const settings = await getSrsSettings()
      return {
        token: currentToken,
        tokenHash: hashRtmpToken(currentToken),
        streamId: input.streamId,
        streamKey: currentKey,
        rtmpUrl: settings.rtmpBaseUrl,
        expiresAt: new Date(String(existing.expires_at)).toISOString(),
      }
    }
  }
  return createRtmpTokenForStream(input)
}

export async function createRtmpTokenForEvent(input: {
  sql?: Sql
  userId: string
  eventId: string
  eventDateId?: string | null
  expiresInSeconds?: number
  updateCredentialTarget?: boolean
}): Promise<RtmpTokenResult> {
  return createRtmpTokenForStream({
    ...input,
    streamId: buildRtmpStreamId(input.eventId, input.eventDateId),
  })
}

export async function findValidRtmpToken(input: {
  sql?: Sql
  streamId: string
  token: string
}): Promise<Record<string, unknown> | null> {
  if (!input.token) return null
  const sql = input.sql ?? getDb()
  const tokenHash = hashRtmpToken(input.token)
  const rows = await sql`
    SELECT st.*, e.status AS event_status
    FROM stream_tokens st
    LEFT JOIN events e ON e.id = st.event_id
    WHERE st.stream_id = ${input.streamId}
      AND st.token_hash = ${tokenHash}
      AND st.is_active = true
      AND st.expires_at > NOW()
    LIMIT 1
  `
  return rows[0] ?? null
}
