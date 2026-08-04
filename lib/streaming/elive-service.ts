import { getDb } from "@/lib/db"
import { getStreamingSettings, SRS_SETTINGS_KEY } from "@/lib/srs-settings"

export interface EliveCredentials {
  rtmpUrl: string
  streamKey: string
  hlsUrl: string
  rawResponse?: string
}

export interface AllocatedEliveKey {
  streamKey: string
  channelId: string
  playbackBaseUrl: string
  hlsUrl: string
  keyIndex: number
}

/**
 * Concurrency-safe atomic allocation of the next eLive stream key in sequence.
 * Uses SQL row-level FOR UPDATE locking on platform_settings to prevent race conditions
 * even when 2 or more users create RTMP events simultaneously.
 */
export async function allocateNextEliveStreamKey(
  sqlClient?: ReturnType<typeof getDb>
): Promise<AllocatedEliveKey> {
  const db = sqlClient || getDb()

  // Use a transaction with row lock (FOR UPDATE) to guarantee atomic index increment
  return await db.begin(async (tx) => {
    const rows = await tx`
      SELECT value FROM platform_settings
      WHERE key = ${SRS_SETTINGS_KEY}
      FOR UPDATE
    `

    const rawSettings = rows[0]?.value || {}
    const channelId = typeof rawSettings.eliveChannelId === "string" && rawSettings.eliveChannelId.trim()
      ? rawSettings.eliveChannelId.trim()
      : "6019"
    const playbackBaseUrl = typeof rawSettings.elivePlaybackBaseUrl === "string" && rawSettings.elivePlaybackBaseUrl.trim()
      ? rawSettings.elivePlaybackBaseUrl.trim().replace(/\/$/, "")
      : "https://oqgdr774l4rm-hls-live.5centscdn.com/6019"

    const streamKeys: string[] = Array.isArray(rawSettings.eliveStreamKeys)
      ? rawSettings.eliveStreamKeys.map((k: unknown) => String(k).trim()).filter(Boolean)
      : []

    let allocatedKey = ""
    let keyIndex = 0

    if (streamKeys.length === 0) {
      // Fallback key if pool is empty
      allocatedKey = `elive_live_${Date.now()}`
      keyIndex = 0
    } else {
      const currentIndex = Math.max(0, Number(rawSettings.eliveNextKeyIndex) || 0)
      keyIndex = currentIndex % streamKeys.length
      allocatedKey = streamKeys[keyIndex]

      const nextIndex = (keyIndex + 1) % streamKeys.length
      rawSettings.eliveNextKeyIndex = nextIndex

      // Persist updated sequence index atomically
      await tx`
        UPDATE platform_settings
        SET value = ${JSON.stringify(rawSettings)}::jsonb, updated_at = NOW()
        WHERE key = ${SRS_SETTINGS_KEY}
      `
    }

    const hlsUrl = `${playbackBaseUrl}/${allocatedKey}/playlist_dvr.m3u8`

    return {
      streamKey: allocatedKey,
      channelId,
      playbackBaseUrl,
      hlsUrl,
      keyIndex,
    }
  })
}

/**
 * Server-side fetcher to call eLive handler page and extract FMS URL & Stream Key.
 * Keeps the eLive handler URL (https://eliveevents.com/elive-handler/6019.php) 100% hidden from client-side code.
 */
export async function fetchEliveCredentials(
  channelId: string,
  streamKey: string
): Promise<EliveCredentials> {
  const settings = await getStreamingSettings()
  const cid = channelId || settings.eliveChannelId || "6019"
  const handlerBase = settings.eliveHandlerUrl
    ? settings.eliveHandlerUrl.replace(/\.php$/i, "")
    : `https://eliveevents.com/elive-handler/${cid}`

  const targetUrl = handlerBase.endsWith(".php")
    ? `${handlerBase}?event=${encodeURIComponent(streamKey)}`
    : `${handlerBase.replace(/\/$/, "")}/${cid}.php?event=${encodeURIComponent(streamKey)}`

  const playbackBase = settings.elivePlaybackBaseUrl || "https://oqgdr774l4rm-hls-live.5centscdn.com/6019"
  const defaultHlsUrl = `${playbackBase.replace(/\/$/, "")}/${streamKey}/playlist_dvr.m3u8`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      console.warn(`[eLive Service] eLive handler returned status ${res.status} for key ${streamKey}`)
    }

    const text = await res.text()

    // Parse RTMP URL from response body (e.g. rtmp://...)
    let rtmpUrl = ""
    let parsedKey = streamKey

    // Regex match for rtmp://...
    const rtmpMatch = text.match(/rtmp:\/\/[^\s"'<>]+/i)
    if (rtmpMatch && rtmpMatch[0]) {
      rtmpUrl = rtmpMatch[0].trim()
    }

    // Search for input fields or key labels in HTML if present
    const keyMatch = text.match(/(?:stream\s*key|key|event)[\s:=]+([a-zA-Z0-9_\-]+)/i)
    if (keyMatch && keyMatch[1]) {
      parsedKey = keyMatch[1].trim()
    }

    // Fallback if rtmpUrl wasn't explicitly found in response body text
    if (!rtmpUrl) {
      rtmpUrl = `rtmp://eliveevents.com/live/${cid}`
    }

    return {
      rtmpUrl,
      streamKey: parsedKey,
      hlsUrl: defaultHlsUrl,
      rawResponse: text.length > 1000 ? text.substring(0, 1000) + "..." : text,
    }
  } catch (error) {
    console.error("[eLive Service] Error fetching eLive credentials:", error)
    return {
      rtmpUrl: `rtmp://eliveevents.com/live/${cid}`,
      streamKey,
      hlsUrl: defaultHlsUrl,
    }
  }
}
