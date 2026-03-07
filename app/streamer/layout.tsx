"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ImpersonationBanner } from "@/components/dashboard/impersonation-banner"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"

function StreamerDashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { isCollapsed } = useSidebar()

  const isDemoPage = pathname?.startsWith("/streamer/events/new/demo-")

  useEffect(() => {
    if (isDemoPage) {
      return
    }

    if (!isAuthenticated) {
      router.push("/")
    } else if (user?.role !== "streamer") {
      router.push("/")
    }
  }, [isAuthenticated, user, router, isDemoPage])

  if (!isDemoPage && (!isAuthenticated || user?.role !== "streamer")) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {!isDemoPage && <ImpersonationBanner />}
      <Sidebar />
      <main className={`transition-all duration-300 ${isCollapsed ? "pl-16" : "pl-64"}`}>
        <div className="p-6">{children}</div>
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
