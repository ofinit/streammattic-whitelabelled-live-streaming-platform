import { NextResponse } from "next/server"
import { getPlatformSetting, setPlatformSetting } from "@/lib/db-queries"
import { jsonError, withRole } from "@/lib/api-helpers"

const ENTITY_TYPES = ["studio", "streamer"] as const

function overrideKey(entityType: string, entityId: string): string {
  return `youtube_config_override_${entityType}:${entityId}`
}

/** GET: Fetch YouTube config override for a studio or streamer (admin only) */
export const GET = withRole(["admin"], async (_, request) => {
  const url = new URL(request.url)
  const entityType = url.searchParams.get("entityType")
  const entityId = url.searchParams.get("entityId")
  if (!entityType || !entityId || !ENTITY_TYPES.includes(entityType as (typeof ENTITY_TYPES)[number])) {
    return jsonError("entityType (studio|streamer) and entityId are required", 400)
  }
  try {
    const key = overrideKey(entityType, entityId)
    const value = await getPlatformSetting(key)
    const allowed = value === true || value === "true"
    return NextResponse.json({ allowed: Boolean(allowed) })
  } catch (e) {
    console.error("Failed to fetch youtube override:", e)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
})

/** POST: Set or clear YouTube config override (admin only) */
export const POST = withRole(["admin"], async (_, request) => {
  try {
    const body = await request.json()
    const { entityType, entityId, allowed } = body
    if (!entityType || !entityId || !ENTITY_TYPES.includes(entityType as (typeof ENTITY_TYPES)[number])) {
      return jsonError("entityType (studio|streamer) and entityId are required", 400)
    }
    const key = overrideKey(entityType, entityId)
    if (allowed === true) {
      await setPlatformSetting(key, true)
    } else {
      await setPlatformSetting(key, null)
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Failed to save youtube override:", e)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
})
