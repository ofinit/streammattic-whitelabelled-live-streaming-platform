/**
 * Form/card stream values vs DB / pricing keys. Keeps client components free of `lib/server/*`.
 * Mirrors {@link STREAM_TYPE_MAP} in credits-logic.
 */

export type CanonicalStreamTypeKey = "rtmp" | "youtube_api" | "youtube_embed" | "third_party"

/** `/api/credits` response uses camelCase column names from `toCamel(user_credits row)`. */
export type CreditsResponseBalanceKey = "rtmp" | "youtubeApi" | "youtubeEmbed" | "thirdParty"

export function formStreamTypeToCanonical(formValue: string): CanonicalStreamTypeKey | null {
  if (!formValue || typeof formValue !== "string") return null
  const map: Record<string, CanonicalStreamTypeKey> = {
    rtmp: "rtmp",
    youtube_api: "youtube_api",
    youtube: "youtube_embed",
    youtube_embed: "youtube_embed",
    embedded: "third_party",
    third_party: "third_party",
  }
  return map[formValue] ?? null
}

export function canonicalStreamTypeToCreditsResponseKey(
  canonical: CanonicalStreamTypeKey,
): CreditsResponseBalanceKey {
  switch (canonical) {
    case "rtmp":
      return "rtmp"
    case "youtube_api":
      return "youtubeApi"
    case "youtube_embed":
      return "youtubeEmbed"
    case "third_party":
      return "thirdParty"
  }
}

export function streamTypeLabelForCredits(canonical: CanonicalStreamTypeKey): string {
  switch (canonical) {
    case "rtmp":
      return "RTMP"
    case "youtube_api":
      return "YouTube API"
    case "youtube_embed":
      return "YouTube Embed"
    case "third_party":
      return "Third party"
  }
}
