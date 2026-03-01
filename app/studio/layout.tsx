"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ImpersonationBanner } from "@/components/dashboard/impersonation-banner"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"
import type { Reseller } from "@/lib/types"

function ResellerLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { isCollapsed } = useSidebar()
  const [hasCompletedSetup, setHasCompletedSetup] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
    } else if (user?.role !== "reseller") {
      router.push("/")
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (user?.role === "reseller") {
      const reseller = user as Reseller
      const needsSetup = !reseller.branding?.platformName || reseller.branding.platformName === ""
      setHasCompletedSetup(true)
    }
  }, [user, pathname, router])

  if (!isAuthenticated || user?.role !== "reseller") {
    return null
  }

  if (pathname === "/reseller/setup") {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <ImpersonationBanner />
      <Sidebar />
      <main className={`transition-all duration-300 ${isCollapsed ? "pl-16" : "pl-64"}`}>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ResellerLayoutInner>{children}</ResellerLayoutInner>
    </SidebarProvider>
  )
}
