"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ImpersonationBanner } from "@/components/dashboard/impersonation-banner"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { isCollapsed } = useSidebar()
  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    if (isLoginPage) return
    if (!isAuthenticated) {
      router.push("/admin/login")
    } else if (user?.role !== "admin") {
      router.push("/login")
    }
  }, [isLoginPage, isAuthenticated, user, router])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SidebarProvider>
  )
}
