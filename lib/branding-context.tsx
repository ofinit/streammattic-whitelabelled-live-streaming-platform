"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Branding, Studio } from "./types"
import type { BrandingServerInitialState } from "@/lib/branding-server-initial"
import { platformLookupBrandingToBranding, studioLookupRowToBranding } from "@/lib/map-lookup-branding"

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

export type { BrandingServerInitialState }

export function BrandingProvider({
  children,
  initialServerState,
}: {
  children: ReactNode
  initialServerState?: BrandingServerInitialState | null
}) {
  const [branding, setBranding] = useState<Branding>(initialServerState?.branding ?? defaultBranding)
  const [studio] = useState<Studio | null>(null)
  const [isWhiteLabel, setIsWhiteLabel] = useState(initialServerState?.isWhiteLabel ?? false)
  const [currentDomain, setCurrentDomain] = useState<string | null>(initialServerState?.currentDomain ?? null)
  const [isLoading, setIsLoading] = useState(!initialServerState)

  useEffect(() => {
    const loadBranding = async () => {
      const hostname = typeof window !== "undefined" ? window.location.hostname : ""
      setCurrentDomain(hostname)

      const serverHost = (initialServerState?.currentDomain || "").toLowerCase().replace(/^www\./, "")
      const clientHost = hostname.toLowerCase().replace(/^www\./, "")
      if (initialServerState && serverHost && serverHost === clientHost) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/branding/lookup?hostname=${encodeURIComponent(hostname)}`)
        if (response.ok) {
          const result = await response.json()
          const payload =
            result && typeof result === "object" && "success" in result && result.success && "data" in result && result.data
              ? (result as { data: { branding?: Record<string, unknown>; isWhiteLabel?: boolean; userId?: string } }).data
              : (result as { branding?: Record<string, unknown>; isWhiteLabel?: boolean; userId?: string })
          const b = payload?.branding
          const wl = Boolean(payload?.isWhiteLabel)
          const uid = typeof payload?.userId === "string" ? payload.userId : ""

          if (wl && b && typeof b === "object" && uid) {
            setIsWhiteLabel(true)
            setBranding(studioLookupRowToBranding(b, uid))
          } else if (b && typeof b === "object") {
            setIsWhiteLabel(false)
            setBranding(platformLookupBrandingToBranding(b))
          } else {
            setIsWhiteLabel(false)
            setBranding(defaultBranding)
          }
        }
      } catch (error) {
        console.error("Failed to load branding context:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBranding()
  }, [initialServerState])

  useEffect(() => {
    if (typeof document !== "undefined" && branding) {
      const root = document.documentElement

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
        isWhiteLabel,
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
