import { notFound } from "next/navigation"
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
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{payload.title}</h1>
      {!payload.storageConfigured ? (
        <p className="mt-4 text-sm text-muted-foreground">
          This gallery is temporarily unavailable (object storage is not configured on the server).
        </p>
      ) : payload.images.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No photos uploaded yet.</p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {payload.images.map((img) => (
            <li key={img.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
              <a
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- presigned S3 URLs */}
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
