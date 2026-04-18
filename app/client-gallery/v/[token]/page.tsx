import { notFound } from "next/navigation"
import { PublicGalleryView } from "@/components/client-gallery/public/public-gallery-view"
import { buildPublicAlbumPayload } from "@/lib/client-gallery-album-service"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const raw = token ? decodeURIComponent(token) : ""
  const payload = await buildPublicAlbumPayload(raw)
  return {
    title: payload?.title ? `${payload.title} · Photos` : "Photo gallery",
  }
}

export default async function PublicClientGalleryPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const raw = token ? decodeURIComponent(token) : ""
  const payload = await buildPublicAlbumPayload(raw)
  if (!payload) {
    notFound()
  }

  return (
    <main className="min-h-screen">
      <PublicGalleryView payload={payload} />
    </main>
  )
}
