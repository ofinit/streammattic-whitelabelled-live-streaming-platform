"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ImpersonationBanner } from "@/components/dashboard/impersonation-banner"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import type { Studio } from "@/lib/types"

function StudioLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, isImpersonating } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { isCollapsed } = useSidebar()
  const [hasCompletedSetup, setHasCompletedSetup] = useState(true)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push("/")
    } else if (user?.role !== "studio") {
      router.push("/")
    }
  }, [isLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (user?.role === "studio") {
      const studio = user as Studio
      const needsSetup = !studio.branding?.platformName || studio.branding.platformName === ""
      setHasCompletedSetup(true)
    }
  }, [user, pathname, router])

  if (isLoading) return null

  if (!isAuthenticated || user?.role !== "studio") {
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
