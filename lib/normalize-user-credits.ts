import type { StreamTypeCredits } from "@/lib/types"

/** Map `user_credits` row (snake or camel from `toCamel`) to `StreamTypeCredits`. */
export function normalizeUserCreditsRow(row: Record<string, unknown> | null | undefined): StreamTypeCredits {
  if (!row) {
    return { rtmp: 0, youtube_api: 0, youtube_embed: 0, third_party: 0 }
  }
  return {
    rtmp: Number(row.rtmp ?? 0),
    youtube_api: Number(row.youtubeApi ?? row.youtube_api ?? 0),
    youtube_embed: Number(row.youtubeEmbed ?? row.youtube_embed ?? 0),
    third_party: Number(row.thirdParty ?? row.third_party ?? 0),
  }
}
