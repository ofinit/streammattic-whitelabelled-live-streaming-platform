"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BrandedLogo } from "@/components/branding/branded-logo"
import {
  CLIENT_GALLERY_BASE,
  clientGalleryNavItems,
  isGalleryNavActive,
} from "@/lib/client-gallery-nav-items"
import { cn } from "@/lib/utils"

export { CLIENT_GALLERY_BASE } from "@/lib/client-gallery-nav-items"

export function ClientGallerySubNav() {
  const pathname = usePathname() ?? ""

  return (
    <nav
      aria-label="AI Client Photo Gallery"
      className="shrink-0 lg:w-52"
    >
      <div className="mb-3 px-1 lg:mb-4">
        <Link
          href={CLIENT_GALLERY_BASE}
          className="inline-flex w-full min-w-0 items-center rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Gallery home"
        >
          <BrandedLogo size="sm" className="min-w-0 max-w-full [&_span]:truncate" />
        </Link>
      </div>
      <p className="mb-2 hidden px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:block">
        Gallery
      </p>
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0 lg:pr-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {clientGalleryNavItems.map(({ title, href, icon: Icon }) => {
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
