"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ImpersonationBanner } from "@/components/dashboard/impersonation-banner"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

function StreamerDashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, isImpersonating } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { isCollapsed } = useSidebar()

  const isDemoPage = pathname?.startsWith("/streamer/events/new/demo-")

  useEffect(() => {
    if (isDemoPage || isLoading) return
    if (!isAuthenticated) {
      router.push("/")
    } else if (user?.role !== "streamer") {
      router.push("/")
    }
  }, [isLoading, isAuthenticated, user, router, isDemoPage])

  if (isLoading && !isDemoPage) return null

  if (!isDemoPage && (!isAuthenticated || user?.role !== "streamer")) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {!isDemoPage && <ImpersonationBanner />}
      <Sidebar />
      <main
        className={cn(
          "min-w-0 transition-all duration-300 pl-0 md:pt-0",
          isImpersonating ? "pt-[6.75rem] md:pt-0" : "pt-14 md:pt-0",
          isCollapsed ? "md:pl-16" : "md:pl-64",
        )}
      >
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  )
}

export default function StreamerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <StreamerDashboardLayoutInner>{children}</StreamerDashboardLayoutInner>
    </SidebarProvider>
  )
}
