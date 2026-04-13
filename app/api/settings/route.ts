import { getDb } from "@/lib/db"
import { getPlatformSetting } from "@/lib/db-queries"
import { invalidateCache } from "@/lib/redis"
import { jsonOk, jsonError, withAuth, withRole } from "@/lib/api-helpers"
import { coerceYoutubeConfigEnabledFlag, coerceYoutubeConfigOverride } from "@/lib/youtube-dashboard-settings"

export const dynamic = "force-dynamic"

export const GET = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const key = url.searchParams.get("key")
  const sql = getDb()

  if (key) {
    const rows = await sql`SELECT key, value FROM platform_settings WHERE key = ${key}`
    if (rows.length === 0) return jsonError("Setting not found", 404)
    const row = rows[0] as { key: string; value: unknown }
    if (row.key === "youtube_config_enabled") {
      return jsonOk({ setting: { ...row, value: coerceYoutubeConfigEnabledFlag(row.value) } })
    }
    return jsonOk({ setting: row })
  }

  // Admin gets all settings, non-admin gets only public settings
  const publicKeys = [
    "platform_name",
    "platform_a_record_ip",
    "credit_pricing",
    "discount_tiers",
    "validity_defaults",
    /** Admin-configured extension tiers + default window (see Admin → Pricing) */
    "validity_extensions",
    "platform_domain",
    "youtube_config_enabled",
    "ai_image_pricing",
    /** Enable/disable Razorpay & Instamojo (no secrets) */
    "payment_gateways",
  ]
  let rows: { key: string; value: unknown }[] =
    user.role === "admin"
      ? (await sql`SELECT key, value, updated_at FROM platform_settings ORDER BY key`) as { key: string; value: unknown }[]
      : (await sql(
          "SELECT key, value FROM platform_settings WHERE key = ANY($1::text[]) ORDER BY key",
          [[publicKeys]],
        )) as { key: string; value: unknown }[]

  rows = rows.map((row) => {
    if (row.key === "youtube_config_enabled") {
      return { ...row, value: coerceYoutubeConfigEnabledFlag(row.value) }
    }
    return row
  })

  // For studio/streamer, add per-entity override so they can override master toggle
  if (user.role === "studio" || user.role === "streamer") {
    const overrideKey = `youtube_config_override_${user.role}:${user.id}`
    const overrideVal = await getPlatformSetting(overrideKey)
    rows = [
      ...rows,
      { key: "youtube_config_override", value: coerceYoutubeConfigOverride(overrideVal) },
    ]
  }

  // Streamers & studios: studio annual subscription catalog price (upgrade / renewal UI)
  if (user.role === "streamer" || user.role === "studio") {
    const studioSub = await getPlatformSetting("studio_annual_subscription")
    rows = [...rows, { key: "studio_annual_subscription", value: studioSub }]
    const photoGallery = await getPlatformSetting("photo_gallery_addon")
    rows = [...rows, { key: "photo_gallery_addon", value: photoGallery }]
  }

  return jsonOk({ settings: rows })
})

export const PUT = withRole(["admin"], async (adminUser, request) => {
  const body = await request.json()
  const { key, value } = body

  if (!key || value === undefined) return jsonError("key and value are required")

  const sql = getDb()
  const rows = await sql`
    INSERT INTO platform_settings (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = NOW()
    RETURNING *
  `

  await invalidateCache(`platform_setting:${key}`)

  return jsonOk({ setting: rows[0] })
})
