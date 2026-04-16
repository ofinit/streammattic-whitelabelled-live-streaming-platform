"use client"

import type { ElementType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  CalendarPlus,
  Images,
  LayoutDashboard,
  QrCode,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

export const CLIENT_GALLERY_BASE = "/client-gallery"

const items: { title: string; href: string; icon: ElementType }[] = [
  { title: "Dashboard", href: CLIENT_GALLERY_BASE, icon: LayoutDashboard },
  { title: "My Events Photos", href: `${CLIENT_GALLERY_BASE}/my-events-photos`, icon: Images },
  { title: "Create Event Photos", href: `${CLIENT_GALLERY_BASE}/create-event-photos`, icon: CalendarPlus },
  { title: "One QR", href: `${CLIENT_GALLERY_BASE}/one-qr`, icon: QrCode },
  { title: "Analytics", href: `${CLIENT_GALLERY_BASE}/analytics`, icon: BarChart3 },
  { title: "Settings", href: `${CLIENT_GALLERY_BASE}/settings`, icon: Settings },
]

function isGalleryNavActive(pathname: string, href: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/"
  const h = href.replace(/\/$/, "") || "/"
  if (h === CLIENT_GALLERY_BASE) return p === CLIENT_GALLERY_BASE
  return p === h || p.startsWith(`${h}/`)
}

export function ClientGallerySubNav() {
  const pathname = usePathname() ?? ""

  return (
    <nav
      aria-label="AI Client Photo Gallery"
      className="shrink-0 lg:w-52"
    >
      <p className="mb-2 hidden px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:block">
        Gallery
      </p>
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0 lg:pr-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(({ title, href, icon: Icon }) => {
          const active = isGalleryNavActive(pathname, href)
          return (
            <li key={href} className="shrink-0 lg:w-full">
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-11 whitespace-nowrap lg:whitespace-normal",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {title}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
