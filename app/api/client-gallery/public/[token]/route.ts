import { jsonError, jsonOk } from "@/lib/api-helpers"
import { buildPublicAlbumPayload } from "@/lib/client-gallery-album-service"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params
  const raw = token ? decodeURIComponent(token) : ""
  if (!raw || raw.length > 128) {
    return jsonError("Not found", 404)
  }

  const payload = await buildPublicAlbumPayload(raw)
  if (!payload) {
    return jsonError("Not found", 404)
  }

  return jsonOk(payload)
}
