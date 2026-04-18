import { redirect } from "next/navigation"
import { CLIENT_GALLERY_BASE } from "@/lib/client-gallery-nav-items"

export const dynamic = "force-dynamic"

/** @deprecated Old One QR feature removed; keep redirect for bookmarks. */
export default function ClientGalleryOneQrRedirectPage() {
  redirect(CLIENT_GALLERY_BASE)
}
