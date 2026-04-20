"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { DashboardWithSidebar } from "@/components/dashboard/dashboard-with-sidebar"
import { ClientGallerySubNav } from "@/components/client-gallery/client-gallery-sub-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import {
  type PhotoGalleryStatusResponse,
  resolveClientGalleryLockedAction,
} from "@/lib/client-gallery-access-ui"
import { SidebarProvider } from "@/lib/sidebar-context"

export default function ClientGalleryLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const isPublicViewerToken = pathname?.startsWith("/client-gallery/v/") ?? false
  const isStreamerOrStudio = user?.role === "streamer" || user?.role === "studio"
  const normalizedPathname = (pathname || "").replace(/\/$/, "") || "/"
  const isGalleryDashboard = normalizedPathname === "/client-gallery"
  const { data: galleryStatus } = useSWR<PhotoGalleryStatusResponse>(
    isStreamerOrStudio ? "/api/photo-gallery-addon/status" : null,
    (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json()),
    { revalidateOnFocus: true },
  )

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
    const entitled = galleryStatus?.entitled === true
    const showLockedPanel = Boolean(galleryStatus && !entitled && !isGalleryDashboard)
    const lockAction = resolveClientGalleryLockedAction({ role: user.role, status: galleryStatus })

    return (
      <SidebarProvider>
        <DashboardWithSidebar hidePrimarySidebar>
          <div className="-mx-4 flex min-h-[calc(100dvh-5rem)] flex-col gap-6 bg-background px-4 py-6 text-foreground sm:-mx-6 sm:px-6 sm:py-8 lg:flex-row lg:gap-8">
            <ClientGallerySubNav />
            <div className="min-w-0 flex-1">
              <div className="mx-auto max-w-6xl">
                {showLockedPanel ? (
                  <Card className="border-border bg-card shadow-sm">
                    <CardHeader>
                      <CardTitle>Service not active</CardTitle>
                      <CardDescription>{lockAction.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                      <Button asChild>
                        <Link href={lockAction.href}>{lockAction.label}</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/client-gallery">Back to gallery dashboard</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  children
                )}
              </div>
            </div>
          </div>
        </DashboardWithSidebar>
      </SidebarProvider>
    )
  }

  return <>{children}</>
}
