"use client"

import type React from "react"
import { ImpersonationBanner } from "@/components/dashboard/impersonation-banner"
import { Sidebar } from "@/components/dashboard/sidebar"
import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

/**
 * Streamer/studio shell: impersonation banner, collapsible sidebar, padded main.
 * Wrap with `SidebarProvider` at the route root (same pattern as `app/streamer/layout.tsx`).
 */
export function DashboardWithSidebar({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, isImpersonating } = useAuth()
  const { isCollapsed } = useSidebar()

  if (isLoading) return null

  if (!isAuthenticated || (user?.role !== "streamer" && user?.role !== "studio")) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <ImpersonationBanner />
      <Sidebar />
      <main
        className={cn(
          "min-w-0 transition-all duration-300 pl-0 md:pt-0",
          isImpersonating
            ? "pt-[6.75rem] md:pt-0"
            : "pt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:pt-0",
          isCollapsed ? "md:pl-16" : "md:pl-64",
        )}
      >
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  )
}
