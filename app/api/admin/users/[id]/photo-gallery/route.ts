import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

/**
 * Grant or revoke client photo gallery entitlement for a studio or streamer account.
 */
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"])
    const { id } = await props.params
    const body = await req.json()
    const enabled = body?.photoGalleryEnabled === true

    if (typeof body?.photoGalleryEnabled !== "boolean") {
      return NextResponse.json({ error: "photoGalleryEnabled boolean required" }, { status: 400 })
    }

    const sql = getDb()
    try {
      await sql`
        INSERT INTO user_addon_entitlements (user_id, photo_gallery_enabled, updated_at)
        VALUES (${id}, ${enabled}, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          photo_gallery_enabled = ${enabled},
          photo_gallery_opt_in = CASE
            WHEN ${enabled} = false THEN false
            ELSE user_addon_entitlements.photo_gallery_opt_in
          END,
          photo_gallery_subscription_expires_at = CASE
            WHEN ${enabled} = false THEN NULL
            ELSE user_addon_entitlements.photo_gallery_subscription_expires_at
          END,
          updated_at = NOW()
      `
    } catch {
      await sql`
        INSERT INTO user_addon_entitlements (user_id, photo_gallery_enabled, updated_at)
        VALUES (${id}, ${enabled}, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          photo_gallery_enabled = ${enabled},
          updated_at = NOW()
      `
    }

    return NextResponse.json({ success: true, photoGalleryEnabled: enabled })
  } catch (error: unknown) {
    console.error("[admin/users/photo-gallery] PATCH", error)
    const msg = error instanceof Error ? error.message : ""
    if (msg === "Forbidden" || msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
