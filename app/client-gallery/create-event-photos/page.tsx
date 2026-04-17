"use client"

import { ClientGalleryCreateEventPhotos } from "@/components/client-gallery/client-gallery-create-event-photos"
import { ClientGalleryMyEventsAccessFallback } from "@/components/client-gallery/client-gallery-my-events-access-fallback"
import { useAuth } from "@/lib/auth-context"

export default function ClientGalleryCreateEventPhotosPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
    )
  }

  if (user && (user.role === "streamer" || user.role === "studio")) {
    return <ClientGalleryCreateEventPhotos />
  }

  return (
    <ClientGalleryMyEventsAccessFallback
      user={user}
      sectionTitle="Create Event Photos"
      unsupportedDescription="This gallery section is for streamer and studio accounts. Sign in with a creator account to create events and add photo galleries in Control Center."
    />
  )
}
