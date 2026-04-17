"use client"

import { ClientGalleryMyAlbums } from "@/components/client-gallery/client-gallery-my-albums"
import { ClientGalleryMyEventsAccessFallback } from "@/components/client-gallery/client-gallery-my-events-access-fallback"
import { useAuth } from "@/lib/auth-context"

export default function ClientGalleryMyAlbumsPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
  }

  if (user && (user.role === "streamer" || user.role === "studio")) {
    return <ClientGalleryMyAlbums />
  }

  return (
    <ClientGalleryMyEventsAccessFallback
      user={user}
      sectionTitle="My albums"
      unsupportedDescription="Photographer albums are available to streamer and studio accounts with the client gallery add-on enabled."
    />
  )
}
