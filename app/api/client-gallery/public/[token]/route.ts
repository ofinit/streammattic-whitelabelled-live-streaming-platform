import { cookies } from "next/headers"
import { jsonError, jsonOk } from "@/lib/api-helpers"
import { buildPublicAlbumPayload } from "@/lib/client-gallery-album-service"
import { GALLERY_UNLOCK_COOKIE_NAME } from "@/lib/client-gallery-unlock-cookie"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params
  const raw = token ? decodeURIComponent(token) : ""
  if (!raw || raw.length > 128) {
    return jsonError("Not found", 404)
  }

  const cookieStore = await cookies()
  const unlockCookie = cookieStore.get(GALLERY_UNLOCK_COOKIE_NAME)?.value ?? null
  const payload = await buildPublicAlbumPayload(raw, unlockCookie)
  if (!payload) {
    return jsonError("Not found", 404)
  }

  return jsonOk(payload)
}
