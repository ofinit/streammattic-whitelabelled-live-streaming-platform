import { getDb } from "@/lib/db"
import { getPlatformSetting } from "@/lib/db-queries"
import { invalidateCache } from "@/lib/redis"
import { jsonOk, jsonError, withAuth, withRole } from "@/lib/api-helpers"

export const GET = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const key = url.searchParams.get("key")
  const sql = getDb()

  if (key) {
    const rows = await sql`SELECT key, value FROM platform_settings WHERE key = ${key}`
    if (rows.length === 0) return jsonError("Setting not found", 404)
    return jsonOk({ setting: rows[0] })
  }

  // Admin gets all settings, non-admin gets only public settings
  const publicKeys = [
    "credit_pricing",
    "discount_tiers",
    "validity_defaults",
    /** Admin-configured extension tiers + default window (see Admin → Pricing) */
    "validity_extensions",
    "payment_gateways",
    "youtube_config_enabled",
  ]
  let rows: { key: string; value: unknown }[] =
    user.role === "admin"
      ? (await sql`SELECT key, value, updated_at FROM platform_settings ORDER BY key`) as { key: string; value: unknown }[]
      : (await sql`SELECT key, value FROM platform_settings WHERE key = ANY(${publicKeys}) ORDER BY key`) as { key: string; value: unknown }[]

  // For studio/streamer, add per-entity override so they can override master toggle
  if (user.role === "studio" || user.role === "streamer") {
    const overrideKey = `youtube_config_override_${user.role}:${user.id}`
    const overrideVal = await getPlatformSetting(overrideKey)
    rows = [...rows, { key: "youtube_config_override", value: overrideVal }]
  }

  // Streamers: show admin-configured studio annual subscription (for upgrade CTA / pricing)
  if (user.role === "streamer") {
    const studioSub = await getPlatformSetting("studio_annual_subscription")
    rows = [...rows, { key: "studio_annual_subscription", value: studioSub }]
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
