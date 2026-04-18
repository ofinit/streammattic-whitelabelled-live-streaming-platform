"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { DashboardWithSidebar } from "@/components/dashboard/dashboard-with-sidebar"
import { ClientGallerySubNav } from "@/components/client-gallery/client-gallery-sub-nav"
import { useAuth } from "@/lib/auth-context"
import { SidebarProvider } from "@/lib/sidebar-context"

export default function ClientGalleryLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const isPublicViewerToken = pathname?.startsWith("/client-gallery/v/") ?? false

  if (isLoading) {
    return (
      <div
        className={cn(
          "min-h-screen px-4 py-10 text-center text-sm text-muted-foreground",
          isPublicViewerToken && "client-gallery-public bg-background text-foreground",
          !isPublicViewerToken && "bg-background",
        )}
      >
        Loading…
      </div>
    )
  }

  if (isPublicViewerToken) {
    return (
      <div className="client-gallery-public min-h-screen bg-background text-foreground">{children}</div>
    )
  }

  if (user?.role === "streamer" || user?.role === "studio") {
    return (
      <SidebarProvider>
        <DashboardWithSidebar hidePrimarySidebar>
          <div className="-mx-4 flex min-h-[calc(100dvh-5rem)] flex-col gap-6 bg-background px-4 py-6 text-foreground sm:-mx-6 sm:px-6 sm:py-8 lg:flex-row lg:gap-8">
            <ClientGallerySubNav />
            <div className="min-w-0 flex-1">
              <div className="mx-auto max-w-6xl">{children}</div>
            </div>
          </div>
        </DashboardWithSidebar>
      </SidebarProvider>
    )
  }

  return <>{children}</>
}
