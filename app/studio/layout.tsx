"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardWithSidebar } from "@/components/dashboard/dashboard-with-sidebar"
import { SidebarProvider } from "@/lib/sidebar-context"
function StudioLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/")
      return
    }

    const canAccessSetup =
      user?.role === "streamer" || user?.role === "studio" || user?.role === "admin"

    if (pathname === "/studio/setup") {
      if (!canAccessSetup) {
        router.replace("/streamer")
      }
      return
    }

    if (user?.role !== "studio") {
      if (user?.role === "streamer") router.replace("/streamer")
      else if (user?.role === "admin") router.replace("/admin")
      else router.replace("/")
    }
  }, [isLoading, isAuthenticated, user?.role, pathname, router])

  if (isLoading) return null

  if (!isAuthenticated) {
    return null
  }

  const canAccessSetup =
    user?.role === "streamer" || user?.role === "studio" || user?.role === "admin"

  if (pathname === "/studio/setup" && canAccessSetup) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  if (user?.role !== "studio") {
    return null
  }

  return <DashboardWithSidebar>{children}</DashboardWithSidebar>
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <StudioLayoutInner>{children}</StudioLayoutInner>
    </SidebarProvider>
  )
}
