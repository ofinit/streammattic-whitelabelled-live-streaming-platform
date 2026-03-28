"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ImpersonationBanner } from "@/components/dashboard/impersonation-banner"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, isImpersonating } = useAuth()
  const router = useRouter()
  const { isCollapsed } = useSidebar()
  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    if (isLoginPage || isLoading) return  // wait until auth check completes
    if (!isAuthenticated) {
      router.push("/admin/login")
    } else if (user?.role !== "admin") {
      router.push("/login")
    }
  }, [isLoginPage, isLoading, isAuthenticated, user, router])

  if (isLoginPage) {
    return <>{children}</>
  }

  // Still checking auth — render nothing to avoid flash/redirect
  if (isLoading) {
    return null
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SidebarProvider>
  )
}
