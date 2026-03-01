"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Branding, Studio, Domain } from "./types"
import { mockStudios, mockDomains } from "./mock-data"

// Default platform branding (StreamMattic)
const defaultBranding: Branding = {
  id: "platform",
  userId: "platform",
  brandName: "StreamMattic",
  themeColor: "#10b981",
  accentColor: "#059669",
  email: "support@streammattic.com",
  metaTitle: "StreamMattic - White-Label Live Streaming Platform",
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
  setDemoStudio: (studioId: string | null) => void
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

// Simulates domain lookup - in production this would be server-side middleware
function lookupDomainStudio(hostname: string): { studio: Studio; domain: Domain } | null {
  // Check custom domains
  const domain = mockDomains.find((d) => d.domain === hostname && d.verificationStatus === "verified")

  if (domain) {
    const foundStudio = mockStudios.find((r) => r.id === domain.userId)
    if (foundStudio) {
      return { studio: foundStudio, domain }
    }
  }

  // Check for subdomain pattern: {studio-slug}.streammattic.com
  const subdomainMatch = hostname.match(/^([^.]+)\.streammattic\.com$/)
  if (subdomainMatch) {
    const slug = subdomainMatch[1]
    const foundStudio = mockStudios.find((r) => r.branding.platformName.toLowerCase().replace(/\s+/g, "-") === slug)
    if (foundStudio) {
      return { studio: foundStudio, domain: null as unknown as Domain }
    }
  }

  return null
}

// Convert studio branding to full Branding interface
function studioToBranding(s: Studio): Branding {
  return {
    id: s.branding.id,
    userId: s.id,
    brandName: s.branding.platformName,
    companyLogo: s.branding.logo,
    themeColor: s.branding.primaryColor,
    accentColor: s.branding.secondaryColor,
    email: s.branding.supportEmail,
    phone: s.branding.supportPhone,
    termsConditions: s.branding.termsUrl,
    privacyPolicy: s.branding.privacyUrl,
    hasGatewayConfig: false,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(defaultBranding)
  const [studio, setStudio] = useState<Studio | null>(null)
  const [currentDomain, setCurrentDomain] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check domain on mount
  useEffect(() => {
    const hostname = typeof window !== "undefined" ? window.location.hostname : ""
    setCurrentDomain(hostname)

    // Skip for localhost/preview - use default branding
    if (hostname === "localhost" || hostname.includes("vercel.app") || hostname.includes("v0.dev")) {
      setIsLoading(false)
      return
    }

    const result = lookupDomainStudio(hostname)
    if (result) {
      setStudio(result.studio)
      setBranding(studioToBranding(result.studio))
    }

    setIsLoading(false)
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

  // For demo purposes - allows switching reseller context
  const setDemoStudio = (resellerId: string | null) => {
    if (!resellerId) {
      setStudio(null)
      setBranding(defaultBranding)
      return
    }

    const foundStudio = mockStudios.find((r) => r.id === resellerId)
    if (foundStudio) {
      setStudio(foundStudio)
      setBranding(resellerToBranding(foundStudio))
    }
  }

  return (
    <BrandingContext.Provider
      value={{
        branding,
        reseller,
        isWhiteLabel: !!reseller,
        isLoading,
        currentDomain,
        setDemoStudio,
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
