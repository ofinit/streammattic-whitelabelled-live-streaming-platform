import type { ElementType } from "react"
import { BarChart3, FolderPlus, Images, LayoutDashboard, QrCode, Settings } from "lucide-react"

export const CLIENT_GALLERY_BASE = "/client-gallery"

export const clientGalleryNavItems: { title: string; href: string; icon: ElementType }[] = [
  { title: "Dashboard", href: CLIENT_GALLERY_BASE, icon: LayoutDashboard },
  { title: "My albums", href: `${CLIENT_GALLERY_BASE}/my-albums`, icon: Images },
  { title: "New album", href: `${CLIENT_GALLERY_BASE}/new-album`, icon: FolderPlus },
  { title: "One QR", href: `${CLIENT_GALLERY_BASE}/one-qr`, icon: QrCode },
  { title: "Analytics", href: `${CLIENT_GALLERY_BASE}/analytics`, icon: BarChart3 },
  { title: "Settings", href: `${CLIENT_GALLERY_BASE}/settings`, icon: Settings },
]

export function isGalleryNavActive(pathname: string, href: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/"
  const h = href.replace(/\/$/, "") || "/"
  if (h === CLIENT_GALLERY_BASE) return p === CLIENT_GALLERY_BASE
  return p === h || p.startsWith(`${h}/`)
}

export function streamingDashboardHref(role: "streamer" | "studio"): "/streamer" | "/studio" {
  return role === "studio" ? "/studio" : "/streamer"
}
