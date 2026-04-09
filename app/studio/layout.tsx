"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ImpersonationBanner } from "@/components/dashboard/impersonation-banner"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import type { Studio } from "@/lib/types"
import { Loader2 } from "lucide-react"

function StudioLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, isImpersonating, refreshUser } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { isCollapsed } = useSidebar()
  const [hasCompletedSetup, setHasCompletedSetup] = useState(true)
  const setupRoleProbeRef = useRef(false)

  useEffect(() => {
    if (pathname !== "/studio/setup") {
      setupRoleProbeRef.current = false
    }
  }, [pathname])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/")
      return
    }
    if (user?.role === "studio") return
    if (pathname === "/studio/setup") {
      if (setupRoleProbeRef.current) return
      setupRoleProbeRef.current = true
      void fetch("/api/auth/me", { credentials: "include" })
        .then((r) => r.json())
        .then((data: { user?: { role?: string } | null }) => {
          if (data.user?.role === "studio") {
            void refreshUser()
          } else {
            router.replace("/streamer")
          }
        })
        .catch(() => {
          router.replace("/streamer")
        })
      return
    }
    router.replace("/")
  }, [isLoading, isAuthenticated, user?.role, pathname, router, refreshUser])

  useEffect(() => {
    if (user?.role === "studio") {
      const studio = user as Studio
      const needsSetup = !studio.branding?.platformName || studio.branding.platformName === ""
      setHasCompletedSetup(true)
    }
  }, [user, pathname, router])

  if (isLoading) return null

  if (!isAuthenticated) {
    return null
  }

  if (user?.role !== "studio") {
    if (pathname === "/studio/setup") {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background px-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">Loading Studio setup…</p>
        </div>
      )
    }
    return null
  }

  if (pathname === "/studio/setup") {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <ImpersonationBanner />
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

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <StudioLayoutInner>{children}</StudioLayoutInner>
    </SidebarProvider>
  )
}
