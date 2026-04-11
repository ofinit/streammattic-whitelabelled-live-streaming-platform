"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { UserRole } from "./types"

export interface AuthUser {
  id: string
  email: string
  name: string
  phone?: string | null
  role: UserRole
  status: string
  avatar?: string | null
  emailVerified?: boolean
  createdAt?: string
  updatedAt?: string
  mockDataCleared?: boolean
  /** ISO timestamp; studio role annual plan end */
  studioSubscriptionExpiresAt?: string | null
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isImpersonating: boolean
  originalUser: AuthUser | null
  impersonatedBy: string | null
  login: (email: string, password: string) => Promise<AuthUser | null>
  logout: () => void
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  impersonate: (userId: string) => Promise<string | null>
  stopImpersonating: () => Promise<string | null>
  updateUserStatus: (userId: string, status: "active" | "suspended") => Promise<boolean>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Store impersonation state in sessionStorage (not persisted across tabs for safety)
const IMPERSONATE_KEY = "sm_impersonate"

function getRouteForRole(role: UserRole): string {
  switch (role) {
    case "admin": return "/admin"
    case "studio": return "/studio"
    case "streamer": return "/streamer"
    default: return "/streamer"
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [originalUser, setOriginalUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [impersonatedBy, setImpersonatedBy] = useState<string | null>(null)

  // Fetch current user from session cookie on mount
  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        if (!data.user) {
          setUser(null)
          setOriginalUser(null)
          setIsImpersonating(false)
          setImpersonatedBy(null)
          return
        }

        const api = data.user as AuthUser

        if (typeof window !== "undefined") {
          const stored = sessionStorage.getItem(IMPERSONATE_KEY)
          if (stored) {
            try {
              const imp = JSON.parse(stored) as {
                originalUser?: AuthUser
                impersonatedBy?: string
                impersonatedUser?: AuthUser
              }
              const target = imp.impersonatedUser

              // Real session is the impersonated account: always use live API user (fixes stale role after e.g. studio upgrade)
              if (target?.id === api.id) {
                setOriginalUser(imp.originalUser ?? null)
                setIsImpersonating(true)
                setImpersonatedBy(imp.impersonatedBy ?? null)
                setUser(api)
                return
              }

              // Admin session viewing as another user
              if (api.role === "admin" && target) {
                setOriginalUser(imp.originalUser ?? null)
                setIsImpersonating(true)
                setImpersonatedBy(imp.impersonatedBy ?? null)
                setUser(target)
                return
              }

              sessionStorage.removeItem(IMPERSONATE_KEY)
            } catch {
              sessionStorage.removeItem(IMPERSONATE_KEY)
            }
          }
        }

        setUser(api)
        setOriginalUser(null)
        setIsImpersonating(false)
        setImpersonatedBy(null)
        return
      }
      setUser(null)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    fetchCurrentUser().finally(() => setIsLoading(false))
  }, [fetchCurrentUser])

  const refreshUser = useCallback(async () => {
    await fetchCurrentUser()
  }, [fetchCurrentUser])

  const login = useCallback(async (email: string, password: string): Promise<AuthUser | null> => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = (await res.json().catch(() => ({}))) as { user?: AuthUser; error?: string }
      if (res.ok && data.user) {
        await fetchCurrentUser()
        setIsLoading(false)
        return data.user
      }
      setIsLoading(false)
      return null
    } catch {
      setIsLoading(false)
      return null
    }
  }, [fetchCurrentUser])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => { })
    } catch { /* ignore */ }
    setUser(null)
    setOriginalUser(null)
    setIsImpersonating(false)
    setImpersonatedBy(null)
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(IMPERSONATE_KEY)
    }
  }, [])

  const register = useCallback(async (data: { email: string; password: string; firstName: string; lastName: string }): Promise<boolean> => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const result = await res.json()
        setUser(result.user)
        setIsLoading(false)
        return true
      }

      setIsLoading(false)
      return false
    } catch {
      setIsLoading(false)
      return false
    }
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      setIsLoading(false)
      return res.ok
    } catch {
      setIsLoading(false)
      return false
    }
  }, [])

  const impersonate = useCallback(async (userId: string): Promise<string | null> => {
    if (!user || user.role !== "admin") return null

    try {
      const res = await fetch("/api/auth/impersonate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (res.ok) {
        const data = await res.json()
        const targetUser = data.user

        // Store impersonation state
        setOriginalUser(user)
        setImpersonatedBy(user.id)
        setUser(targetUser)
        setIsImpersonating(true)

        if (typeof window !== "undefined") {
          sessionStorage.setItem(IMPERSONATE_KEY, JSON.stringify({
            originalUser: user,
            impersonatedBy: user.id,
            impersonatedUser: targetUser,
          }))
        }

        return getRouteForRole(targetUser.role)
      }
    } catch { /* ignore */ }

    return null
  }, [user])

  const stopImpersonating = useCallback(async (): Promise<string | null> => {
    if (!originalUser) return null

    const route = getRouteForRole(originalUser.role)
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(IMPERSONATE_KEY)
    }
    setOriginalUser(null)
    setIsImpersonating(false)
    setImpersonatedBy(null)

    await fetchCurrentUser()
    return route
  }, [originalUser, fetchCurrentUser])

  const updateUserStatus = useCallback(async (userId: string, status: "active" | "suspended"): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      return res.ok
    } catch {
      return false
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isImpersonating,
        originalUser,
        impersonatedBy,
        login,
        logout,
        register,
        changePassword,
        impersonate,
        stopImpersonating,
        updateUserStatus,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
