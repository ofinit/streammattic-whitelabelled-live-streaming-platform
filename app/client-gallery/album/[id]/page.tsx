"use client"

import { useParams } from "next/navigation"
import { ClientGalleryAlbumWorkspace } from "@/components/client-gallery/client-gallery-album-workspace"
import { ClientGalleryMyEventsAccessFallback } from "@/components/client-gallery/client-gallery-my-events-access-fallback"
import { useAuth } from "@/lib/auth-context"
import { isUuid } from "@/lib/client-gallery-utils"

export default function ClientGalleryAlbumPage() {
  const { user, isLoading } = useAuth()
  const params = useParams()
  const rawId = typeof params?.id === "string" ? params.id : ""

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
  }

  if (!user || (user.role !== "streamer" && user.role !== "studio")) {
    return (
      <ClientGalleryMyEventsAccessFallback
        user={user}
        sectionTitle="Album"
        unsupportedDescription="Manage photographer albums with a streamer or studio account."
      />
    )
  }

  if (!isUuid(rawId)) {
    return <p className="py-8 text-sm text-destructive">Invalid album.</p>
  }

  return <ClientGalleryAlbumWorkspace albumId={rawId} />
}
