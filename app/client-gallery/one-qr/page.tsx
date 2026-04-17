"use client"

import { ClientGalleryOneQr } from "@/components/client-gallery/client-gallery-one-qr"
import { ClientGalleryRoutePlaceholder } from "@/components/client-gallery/client-gallery-route-placeholder"
import { useAuth } from "@/lib/auth-context"

export default function ClientGalleryOneQrPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
  }

  if (user && (user.role === "streamer" || user.role === "studio")) {
    return <ClientGalleryOneQr />
  }

  return <ClientGalleryRoutePlaceholder title="One QR" />
}
