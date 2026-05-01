import { getDb } from "@/lib/db"
import { extractTokenFromSrsParam, findValidRtmpToken, hashRtmpToken } from "@/lib/rtmp-auth"
import { getSrsSettings } from "@/lib/srs-settings"

type Sql = ReturnType<typeof getDb>

export type SrsHookPayload = {
  app?: string
  stream?: string
  param?: string
  ip?: string
  client_id?: string | number
  [key: string]: unknown
}

type HookResult = {
  ok: boolean
  status: number
  reason: string
  sessionId?: string
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value)
}

function iso(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

async function logAttempt(input: {
  sql: Sql
  streamId: string
  token?: string
  app?: string
  ip?: string
  allowed: boolean
  reason: string
  payload: SrsHookPayload
}) {
  const tokenHash = input.token ? hashRtmpToken(input.token) : null
  await input.sql`
    INSERT INTO stream_publish_attempts (stream_id, token_hash, app, ip, allowed, reason, raw_payload)
    VALUES (
      ${input.streamId || null}, ${tokenHash}, ${input.app || null}, ${input.ip || null},
      ${input.allowed}, ${input.reason}, ${JSON.stringify(input.payload)}::jsonb
    )
  `
}

export async function handleSrsPublish(payload: SrsHookPayload): Promise<HookResult> {
  const sql = getDb()
  const settings = await getSrsSettings()
  const streamId = asString(payload.stream).trim()
  const token = extractTokenFromSrsParam(payload.param)

  if (!streamId || !token) {
    await logAttempt({ sql, streamId, token, app: payload.app, ip: payload.ip, allowed: false, reason: "missing_stream_or_token", payload })
    return { ok: false, status: 403, reason: "Missing stream id or token" }
  }

  const tokenRow = await findValidRtmpToken({ sql, streamId, token })
  if (!tokenRow) {
    await logAttempt({ sql, streamId, token, app: payload.app, ip: payload.ip, allowed: false, reason: "invalid_or_expired_token", payload })
    return { ok: false, status: 403, reason: "Invalid or expired token" }
  }

  const tokenId = tokenRow.id as string
  const userId = tokenRow.user_id as string
  const eventId = (tokenRow.event_id as string | null) ?? null
  const eventDateId = (tokenRow.event_date_id as string | null) ?? null

  const active = await sql`
    SELECT id FROM stream_sessions
    WHERE stream_id = ${streamId} AND is_active = true
    LIMIT 1
  `
  if (active.length > 0) {
    await logAttempt({ sql, streamId, token, app: payload.app, ip: payload.ip, allowed: false, reason: "stream_already_active", payload })
    return { ok: false, status: 403, reason: "Stream already active" }
  }

  const previous = await sql`
    SELECT *
    FROM stream_sessions
    WHERE stream_id = ${streamId}
    ORDER BY COALESCE(last_unpublish_at, started_at) DESC
    LIMIT 1
  `
  const prev = previous[0] as Record<string, unknown> | undefined
  const prevStop = prev ? iso(prev.last_unpublish_at) : null
  const canResume =
    prev &&
    !prev.is_active &&
    prevStop &&
    Date.now() - new Date(prevStop).getTime() <= settings.sessionResumeSeconds * 1000 &&
    prev.merge_status !== "merged" &&
    prev.merge_status !== "merging"

  let sessionId: string
  if (canResume) {
    sessionId = prev.id as string
    await sql`
      UPDATE stream_sessions
      SET is_active = true,
          token_id = ${tokenId},
          last_publish_at = NOW(),
          ended_at = NULL,
          merge_after = NULL,
          merge_status = 'pending',
          updated_at = NOW()
      WHERE id = ${sessionId}
    `
  } else {
    const rows = await sql`
      INSERT INTO stream_sessions (
        user_id, event_id, event_date_id, token_id, stream_id, started_at, last_publish_at, is_active
      ) VALUES (
        ${userId}, ${eventId}, ${eventDateId}, ${tokenId}, ${streamId}, NOW(), NOW(), true
      )
      RETURNING id
    `
    sessionId = rows[0].id as string
  }

  await sql`
    INSERT INTO stream_session_segments (
      session_id, token_id, stream_id, started_at, publisher_ip, srs_client_id, raw_publish_payload
    ) VALUES (
      ${sessionId}, ${tokenId}, ${streamId}, NOW(), ${payload.ip || null},
      ${payload.client_id != null ? String(payload.client_id) : null}, ${JSON.stringify(payload)}::jsonb
    )
  `
  await sql`
    UPDATE stream_tokens
    SET last_used_at = NOW()
    WHERE id = ${tokenId}
  `
  if (eventId) {
    await sql`
      UPDATE events
      SET status = 'live', started_at = COALESCE(started_at, NOW()), ended_at = NULL, updated_at = NOW()
      WHERE id = ${eventId}
    `
  }
  await logAttempt({ sql, streamId, token, app: payload.app, ip: payload.ip, allowed: true, reason: canResume ? "resumed" : "started", payload })
  return { ok: true, status: 200, reason: canResume ? "Resumed stream session" : "Started stream session", sessionId }
}

async function chargeExtraCredits(input: {
  sql: Sql
  userId: string
  eventId: string | null
  sessionId: string
  streamId: string
  accumulatedSeconds: number
  alreadyChargedExtraBlocks: number
  includedCreditBlocks: number
}) {
  const settings = await getSrsSettings()
  const blockSeconds = settings.creditBlockMinutes * 60
  const totalBlocksUsed = Math.ceil(input.accumulatedSeconds / blockSeconds)
  const extraBlocksNeeded = Math.max(0, totalBlocksUsed - input.includedCreditBlocks - input.alreadyChargedExtraBlocks)
  if (extraBlocksNeeded <= 0) {
    await input.sql`
      INSERT INTO stream_usage (user_id, event_id, session_id, stream_id, seconds_used, minutes_used, credit_blocks_charged, reason)
      VALUES (${input.userId}, ${input.eventId}, ${input.sessionId}, ${input.streamId}, ${input.accumulatedSeconds},
        ${Math.ceil(input.accumulatedSeconds / 60)}, 0, 'rtmp_session_update')
    `
    return { charged: 0, insufficient: false }
  }

  const deducted = await input.sql`
    UPDATE user_credits
    SET rtmp = rtmp - ${extraBlocksNeeded}, updated_at = NOW()
    WHERE user_id = ${input.userId} AND rtmp >= ${extraBlocksNeeded}
    RETURNING *
  `
  if (deducted.length === 0) {
    await input.sql`
      INSERT INTO stream_usage (user_id, event_id, session_id, stream_id, seconds_used, minutes_used, credit_blocks_charged, reason)
      VALUES (${input.userId}, ${input.eventId}, ${input.sessionId}, ${input.streamId}, ${input.accumulatedSeconds},
        ${Math.ceil(input.accumulatedSeconds / 60)}, 0, 'rtmp_insufficient_credits')
    `
    return { charged: 0, insufficient: true }
  }

  const deduction = await input.sql`
    INSERT INTO credit_deductions (user_id, event_id, stream_type, amount, reason)
    VALUES (${input.userId}, ${input.eventId}, 'rtmp', ${extraBlocksNeeded}, 'RTMP streaming usage over included 360-minute block')
    RETURNING id
  `
  const deductionId = deduction[0]?.id as string | undefined
  await input.sql`
    INSERT INTO stream_usage (
      user_id, event_id, session_id, stream_id, seconds_used, minutes_used, credit_blocks_charged, reason, credit_deduction_id
    ) VALUES (
      ${input.userId}, ${input.eventId}, ${input.sessionId}, ${input.streamId}, ${input.accumulatedSeconds},
      ${Math.ceil(input.accumulatedSeconds / 60)}, ${extraBlocksNeeded}, 'rtmp_extra_credit_block', ${deductionId ?? null}
    )
  `
  await input.sql`
    UPDATE stream_sessions
    SET charged_extra_blocks = charged_extra_blocks + ${extraBlocksNeeded}, updated_at = NOW()
    WHERE id = ${input.sessionId}
  `
  return { charged: extraBlocksNeeded, insufficient: false }
}

export async function handleSrsUnpublish(payload: SrsHookPayload): Promise<HookResult> {
  const sql = getDb()
  const settings = await getSrsSettings()
  const streamId = asString(payload.stream).trim()
  if (!streamId) return { ok: false, status: 400, reason: "Missing stream id" }

  const sessions = await sql`
    SELECT *
    FROM stream_sessions
    WHERE stream_id = ${streamId} AND is_active = true
    ORDER BY last_publish_at DESC
    LIMIT 1
  `
  const session = sessions[0] as Record<string, unknown> | undefined
  if (!session) return { ok: true, status: 200, reason: "No active session" }

  const segmentRows = await sql`
    SELECT *
    FROM stream_session_segments
    WHERE session_id = ${session.id} AND ended_at IS NULL
    ORDER BY started_at DESC
    LIMIT 1
  `
  const segment = segmentRows[0] as Record<string, unknown> | undefined
  const segmentStart = segment ? new Date(iso(segment.started_at) || Date.now()) : new Date()
  const durationSeconds = Math.max(0, Math.ceil((Date.now() - segmentStart.getTime()) / 1000))

  if (segment) {
    await sql`
      UPDATE stream_session_segments
      SET ended_at = NOW(),
          duration_seconds = ${durationSeconds},
          raw_unpublish_payload = ${JSON.stringify(payload)}::jsonb
      WHERE id = ${segment.id}
    `
  }

  const accumulatedSeconds = Number(session.accumulated_seconds || 0) + durationSeconds
  const mergeDelay = `${settings.mergeInactivitySeconds || 600} seconds`
  await sql`
    UPDATE stream_sessions
    SET is_active = false,
        last_unpublish_at = NOW(),
        ended_at = NOW(),
        accumulated_seconds = ${accumulatedSeconds},
        merge_after = NOW() + ${mergeDelay}::interval,
        merge_status = 'pending',
        updated_at = NOW()
    WHERE id = ${session.id}
  `

  const eventId = (session.event_id as string | null) ?? null
  if (eventId) {
    await sql`
      UPDATE events
      SET status = 'ended', ended_at = NOW(), updated_at = NOW()
      WHERE id = ${eventId}
    `
  }

  const charge = await chargeExtraCredits({
    sql,
    userId: session.user_id as string,
    eventId,
    sessionId: session.id as string,
    streamId,
    accumulatedSeconds,
    alreadyChargedExtraBlocks: Number(session.charged_extra_blocks || 0),
    includedCreditBlocks: Number(session.included_credit_blocks || 1),
  })

  if (charge.insufficient && session.token_id) {
    await sql`
      UPDATE stream_tokens
      SET is_active = false, revoked_at = NOW()
      WHERE id = ${session.token_id}
    `
  }

  return { ok: true, status: 200, reason: charge.insufficient ? "Stopped; insufficient credits for extra usage" : "Stopped stream session", sessionId: session.id as string }
}

export async function markMergeReadySessions(): Promise<number> {
  const sql = getDb()
  const rows = await sql`
    UPDATE stream_sessions
    SET merge_status = 'merge_ready', updated_at = NOW()
    WHERE is_active = false
      AND merged = false
      AND merge_status = 'pending'
      AND merge_after IS NOT NULL
      AND merge_after <= NOW()
    RETURNING id
  `
  return rows.length
}

export async function reconcileActiveRtmpUsage(): Promise<{
  activeChecked: number
  extraCreditsCharged: number
  insufficientCredits: number
  mergeReady: number
}> {
  const sql = getDb()
  const sessions = await sql`
    SELECT ss.*,
           seg.started_at AS open_segment_started_at
    FROM stream_sessions ss
    LEFT JOIN LATERAL (
      SELECT started_at
      FROM stream_session_segments
      WHERE session_id = ss.id AND ended_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    ) seg ON true
    WHERE ss.is_active = true
  `
  let extraCreditsCharged = 0
  let insufficientCredits = 0

  for (const session of sessions) {
    const openStarted = iso(session.open_segment_started_at)
    const openSeconds = openStarted ? Math.max(0, Math.ceil((Date.now() - new Date(openStarted).getTime()) / 1000)) : 0
    const accumulatedSeconds = Number(session.accumulated_seconds || 0) + openSeconds
    const charge = await chargeExtraCredits({
      sql,
      userId: session.user_id as string,
      eventId: (session.event_id as string | null) ?? null,
      sessionId: session.id as string,
      streamId: session.stream_id as string,
      accumulatedSeconds,
      alreadyChargedExtraBlocks: Number(session.charged_extra_blocks || 0),
      includedCreditBlocks: Number(session.included_credit_blocks || 1),
    })
    extraCreditsCharged += charge.charged
    if (charge.insufficient) {
      insufficientCredits++
      if (session.token_id) {
        await sql`
          UPDATE stream_tokens
          SET is_active = false, revoked_at = NOW()
          WHERE id = ${session.token_id}
        `
      }
    }
  }

  const mergeReady = await markMergeReadySessions()
  return { activeChecked: sessions.length, extraCreditsCharged, insufficientCredits, mergeReady }
}
