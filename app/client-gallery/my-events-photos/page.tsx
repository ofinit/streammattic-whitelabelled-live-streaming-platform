"use client"

import { ClientGalleryMyEventsPhotos } from "@/components/client-gallery/client-gallery-my-events-photos"
import { ClientGalleryMyEventsAccessFallback } from "@/components/client-gallery/client-gallery-my-events-access-fallback"
import { useAuth } from "@/lib/auth-context"

export default function ClientGalleryMyEventsPhotosPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
    )
  }

  if (user && (user.role === "streamer" || user.role === "studio")) {
    return <ClientGalleryMyEventsPhotos />
  }

  return <ClientGalleryMyEventsAccessFallback user={user} />
}
