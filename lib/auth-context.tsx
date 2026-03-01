"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { User, Studio, EndUser, UserRole } from "./types"
import { mockAdmin, mockStudios, mockUsers } from "./mock-data"

const AUTH_STORAGE_KEY = "streammattic_auth"

interface AuthState {
  user: User | Studio | EndUser | null
  originalUser: User | Studio | null
  isImpersonating: boolean
  impersonatedBy: string | null
}

interface AuthContextType {
  user: User | Studio | EndUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isImpersonating: boolean
  originalUser: User | Studio | null
  impersonatedBy: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  impersonate: (userId: string) => string | null
  stopImpersonating: () => string | null
  switchRole: (role: UserRole) => void
  updateUserStatus: (userId: string, status: "active" | "suspended") => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function saveAuthState(state: AuthState) {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
  }
}

function loadAuthState(): AuthState | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
  }
  return null
}

function clearAuthState() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

function getRouteForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin"
    case "studio":
      return "/studio"
    case "user":
      return "/dashboard"
    default:
      return "/dashboard"
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | Studio | EndUser | null>(null)
  const [originalUser, setOriginalUser] = useState<User | Studio | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start with loading to check localStorage
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [impersonatedBy, setImpersonatedBy] = useState<string | null>(null)

  useEffect(() => {
    const storedState = loadAuthState()
    if (storedState) {
      setUser(storedState.user)
      setOriginalUser(storedState.originalUser)
      setIsImpersonating(storedState.isImpersonating)
      setImpersonatedBy(storedState.impersonatedBy)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    let loggedInUser: User | Studio | EndUser | null = null

    if (email === "admin@streammattic.com") {
      loggedInUser = mockAdmin
    } else {
      const foundStudio = mockStudios.find((r) => r.email === email)
      if (foundStudio) {
        loggedInUser = foundStudio
      } else {
        const endUser = mockUsers.find((u) => u.email === email)
        if (endUser) {
          loggedInUser = endUser
        }
      }
    }

    if (loggedInUser) {
      setUser(loggedInUser)
      saveAuthState({
        user: loggedInUser,
        originalUser: null,
        isImpersonating: false,
        impersonatedBy: null,
      })
      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setOriginalUser(null)
    setIsImpersonating(false)
    setImpersonatedBy(null)
    clearAuthState()
  }, [])

  const register = useCallback(
    async (data: { email: string; password: string; firstName: string; lastName: string }): Promise<boolean> => {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const existingUser = [...mockStudios, ...mockUsers].find((u) => u.email === data.email)
      if (existingUser) {
        setIsLoading(false)
        return false
      }

      setIsLoading(false)
      return true
    },
    [],
  )

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    return true
  }, [])

  const impersonate = useCallback(
    (userId: string): string | null => {
      // Only admin and studios can impersonate
      if (user?.role !== "admin" && user?.role !== "studio") return null

      const targetUser = [...mockStudios, ...mockUsers].find((u) => u.id === userId)
      if (targetUser) {
        // Update state
        setOriginalUser(user as User | Studio)
        setImpersonatedBy(user.id)
        setUser(targetUser)
        setIsImpersonating(true)

        saveAuthState({
          user: targetUser,
          originalUser: user as User | Studio,
          isImpersonating: true,
          impersonatedBy: user.id,
        })

        // Return the target route
        return getRouteForRole(targetUser.role)
      }

      return null
    },
    [user],
  )

  const stopImpersonating = useCallback((): string | null => {
    if (originalUser) {
      setUser(originalUser)
      setOriginalUser(null)
      setIsImpersonating(false)
      setImpersonatedBy(null)

      saveAuthState({
        user: originalUser,
        originalUser: null,
        isImpersonating: false,
        impersonatedBy: null,
      })

      return getRouteForRole(originalUser.role)
    }
    return null
  }, [originalUser])

  const switchRole = useCallback((role: UserRole) => {
    let newUser: User | Studio | EndUser | null = null

    switch (role) {
      case "admin":
        newUser = mockAdmin
        break
      case "studio":
        newUser = mockStudios[0]
        break
      case "user":
        newUser = mockUsers[0]
        break
    }

    if (newUser) {
      setUser(newUser)
      setIsImpersonating(false)
      setOriginalUser(null)
      setImpersonatedBy(null)

      saveAuthState({
        user: newUser,
        originalUser: null,
        isImpersonating: false,
        impersonatedBy: null,
      })
    }
  }, [])

  const updateUserStatus = useCallback(async (userId: string, status: "active" | "suspended"): Promise<boolean> => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    return true
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
        switchRole,
        updateUserStatus,
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
