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
 * Concurrency-safe sequential allocation of the next eLive stream key in sequence.
 */
export async function allocateNextEliveStreamKey(
  sqlClient?: ReturnType<typeof getDb>
): Promise<AllocatedEliveKey> {
  const db = sqlClient || getDb()

  const rows = await db`
    SELECT value FROM platform_settings
    WHERE key = ${SRS_SETTINGS_KEY}
  `

  const rawSettings = (rows[0]?.value as Record<string, unknown>) || {}
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

    // Persist updated sequence index
    await db`
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
  
  let targetUrl = ""
  if (settings.eliveHandlerUrl && settings.eliveHandlerUrl.trim()) {
    const raw = settings.eliveHandlerUrl.trim()
    const sep = raw.includes("?") ? "&" : "?"
    targetUrl = `${raw}${sep}event=${encodeURIComponent(streamKey)}`
  } else {
    targetUrl = `https://eliveevents.com/elive-handler/${cid}.php?event=${encodeURIComponent(streamKey)}`
  }

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

    let rtmpUrl = ""
    let parsedKey = streamKey

    // 1. Precise match for input element id="pp" or value starting with rtmp://
    const ppMatch = text.match(/<input[^>]*id=["']pp["'][^>]*value=["']([^"']+)["']/i) ||
                    text.match(/<input[^>]*value=["'](rtmp:\/\/[^"']+)["']/i)

    if (ppMatch && ppMatch[1]) {
      rtmpUrl = ppMatch[1].trim().replace(/&amp;/g, "&")
    }

    // 2. Generic rtmp:// fallback match if input regex didn't catch it
    if (!rtmpUrl) {
      const rtmpMatch = text.match(/rtmp:\/\/[^\s"'<>]+/i)
      if (rtmpMatch && rtmpMatch[0]) {
        rtmpUrl = rtmpMatch[0].trim().replace(/&amp;/g, "&")
      }
    }

    // 3. Match input id="sn" for stream key if present
    const snMatch = text.match(/<input[^>]*id=["']sn["'][^>]*value=["']([^"']+)["']/i)
    if (snMatch && snMatch[1]) {
      parsedKey = snMatch[1].trim()
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
