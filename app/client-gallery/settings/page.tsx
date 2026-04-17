"use client"

import { ClientGalleryMyEventsAccessFallback } from "@/components/client-gallery/client-gallery-my-events-access-fallback"
import { ClientGalleryStorageSettings } from "@/components/client-gallery/client-gallery-storage-settings"
import { useAuth } from "@/lib/auth-context"

export default function ClientGallerySettingsPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
  }

  if (user && (user.role === "streamer" || user.role === "studio")) {
    return <ClientGalleryStorageSettings />
  }

  return (
    <ClientGalleryMyEventsAccessFallback
      user={user}
      sectionTitle="Settings"
      unsupportedDescription="Storage settings are available to streamer and studio accounts with the client gallery add-on enabled."
    />
  )
}
