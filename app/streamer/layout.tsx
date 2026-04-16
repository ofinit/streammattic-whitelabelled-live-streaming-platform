"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardWithSidebar } from "@/components/dashboard/dashboard-with-sidebar"
import { SidebarProvider } from "@/lib/sidebar-context"

function StreamerDashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push("/")
    } else if (user?.role === "studio") {
      router.replace("/studio")
    } else if (user?.role === "admin") {
      router.replace("/admin")
    } else if (user?.role !== "streamer") {
      router.push("/")
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) return null

  if (!isAuthenticated || user?.role !== "streamer") {
    return null
  }

  return <DashboardWithSidebar>{children}</DashboardWithSidebar>
}

export default function StreamerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <StreamerDashboardLayoutInner>{children}</StreamerDashboardLayoutInner>
    </SidebarProvider>
  )
}
