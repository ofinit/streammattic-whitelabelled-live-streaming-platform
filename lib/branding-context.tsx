"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Branding, Studio } from "./types"
import { resolvePlatformDisplayName } from "@/lib/platform-display-name"

// Default platform branding (StreamLivee)
const defaultBranding: Branding = {
  id: "platform",
  userId: "platform",
  brandName: "StreamLivee",
  themeColor: "#10b981",
  accentColor: "#059669",
  email: "support@streamlivee.com",
  metaTitle: "StreamLivee - White-Label Live Streaming Platform",
  metaDescription: "Multi-tenant live streaming platform for studios and content creators",
  hasGatewayConfig: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

interface BrandingContextType {
  branding: Branding
  studio: Studio | null
  isWhiteLabel: boolean
  isLoading: boolean
  currentDomain: string | null
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)


export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(defaultBranding)
  const [studio, setStudio] = useState<Studio | null>(null)
  const [currentDomain, setCurrentDomain] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check domain on mount
  useEffect(() => {
    const loadBranding = async () => {
      const hostname = typeof window !== "undefined" ? window.location.hostname : ""
      setCurrentDomain(hostname)

      try {
        const response = await fetch(`/api/branding/lookup?hostname=${hostname}`)
        if (response.ok) {
          const result = await response.json()
          const payload =
            result && typeof result === "object" && "success" in result && result.success && "data" in result && result.data
              ? (result as { data: { branding?: Record<string, unknown>; isWhiteLabel?: boolean; userId?: string } }).data
              : (result as { branding?: Record<string, unknown>; isWhiteLabel?: boolean; userId?: string })
          const b = payload?.branding
          if (b && typeof b === "object") {
            const brandName = resolvePlatformDisplayName(
              b.brandName ?? b.platformName ?? defaultBranding.brandName,
              defaultBranding.brandName,
            )
            const themeColor = (b.themeColor || b.primaryColor || defaultBranding.themeColor) as string
            const accentColor = (b.accentColor || b.secondaryColor || defaultBranding.accentColor) as string
            setBranding({
              ...defaultBranding,
              brandName,
              themeColor,
              accentColor,
              email: (b.email || b.supportEmail || defaultBranding.email) as string,
              metaTitle: (b.metaTitle as string) || defaultBranding.metaTitle,
              metaDescription: (b.metaDescription as string) || defaultBranding.metaDescription,
            })
          }
        }
      } catch (error) {
        console.error("Failed to load branding context:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBranding()
  }, [])

  // Apply theme colors as CSS variables
  useEffect(() => {
    if (typeof document !== "undefined" && branding) {
      const root = document.documentElement

      // Convert hex to HSL for CSS variables
      const hexToHSL = (hex: string) => {
        const r = Number.parseInt(hex.slice(1, 3), 16) / 255
        const g = Number.parseInt(hex.slice(3, 5), 16) / 255
        const b = Number.parseInt(hex.slice(5, 7), 16) / 255

        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        let h = 0,
          s = 0
        const l = (max + min) / 2

        if (max !== min) {
          const d = max - min
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
          switch (max) {
            case r:
              h = ((g - b) / d + (g < b ? 6 : 0)) / 6
              break
            case g:
              h = ((b - r) / d + 2) / 6
              break
            case b:
              h = ((r - g) / d + 4) / 6
              break
          }
        }

        return `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`
      }

      const primaryHSL = hexToHSL(branding.themeColor)
      const accentHSL = hexToHSL(branding.accentColor || branding.themeColor)

      root.style.setProperty("--primary", primaryHSL)
      root.style.setProperty("--color-primary", primaryHSL)
      root.style.setProperty("--accent", accentHSL)
      root.style.setProperty("--color-accent", accentHSL)
      root.style.setProperty("--ring", primaryHSL)
      root.style.setProperty("--color-ring", primaryHSL)
      root.style.setProperty("--sidebar-primary", primaryHSL)
      root.style.setProperty("--color-sidebar-primary", primaryHSL)
    }
  }, [branding])

  return (
    <BrandingContext.Provider
      value={{
        branding,
        studio,
        isWhiteLabel: !!studio,
        isLoading,
        currentDomain,
      }}
    >
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  const context = useContext(BrandingContext)
  if (context === undefined) {
    throw new Error("useBranding must be used within a BrandingProvider")
  }
  return context
}
