import { jsonOk } from "@/lib/api-helpers"
import { recordGuestAlbumView } from "@/lib/client-gallery-album-service"

export const dynamic = "force-dynamic"

export async function POST(_request: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params
  const raw = token ? decodeURIComponent(token) : ""
  if (!raw) {
    return jsonOk({ ok: false })
  }
  const ok = await recordGuestAlbumView(raw)
  return jsonOk({ ok })
}
