/** User-facing copy — keep in sync with event form validation. */
export const THIRD_PARTY_YOUTUBE_IFRAME_ERROR =
  "YouTube iframes are not allowed for Third Party. Use “YouTube Embed” with your video URL, or “YouTube API” for live ingest."

const YT_IN_SRC = /(?:youtube\.com|youtube-nocookie\.com|youtu\.be)/i

function collectSrcLikeValues(html: string): string[] {
  const out: string[] = []
  const quoted = /\b(?:src|data-src)\s*=\s*(["'])([\s\S]*?)\1/gi
  let m: RegExpExecArray | null
  while ((m = quoted.exec(html)) !== null) {
    if (m[2]) out.push(m[2])
  }
  const unquoted = /\b(?:src|data-src)\s*=\s*([^\s>"']+)/gi
  while ((m = unquoted.exec(html)) !== null) {
    if (m[1]) out.push(m[1])
  }
  return out
}

/**
 * True when HTML looks like a YouTube player embed (iframe/embed/object with YouTube host).
 * Third-party stream type should use HLS/m3u8 or non-YouTube providers only.
 */
export function thirdPartyEmbedCodeContainsYouTube(html: string): boolean {
  const s = String(html || "").trim()
  if (!s) return false

  if (/<iframe\b/i.test(s) || /<\s*embed\b/i.test(s) || /<\s*object\b/i.test(s)) {
    for (const v of collectSrcLikeValues(s)) {
      if (YT_IN_SRC.test(v)) return true
    }
  }

  // Unquoted or minified iframes
  if (/<iframe[^>]{0,12000}?\ssrc\s*=\s*["']?https?:\/\/[^"'>\s]*youtube/i.test(s)) return true
  if (/<iframe[^>]{0,12000}?\ssrc\s*=\s*["']?https?:\/\/[^"'>\s]*youtu\.be/i.test(s)) return true

  return false
}
