"use client"

import { Radio } from "lucide-react"
import { useBranding } from "@/lib/branding-context"
import Image from "next/image"

interface BrandedLogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export function BrandedLogo({ size = "md", showText = true, className = "" }: BrandedLogoProps) {
  const { branding, isWhiteLabel } = useBranding()

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }

  const isDefaultLogo = (url?: string | null) =>
    !url || url.includes("icon.svg") || url.includes("placeholder")

  const logoUrl = !isDefaultLogo(branding.companyLogo) ? branding.companyLogo : null

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {logoUrl ? (
        <div className={`relative ${sizeClasses[size]}`}>
          <Image
            src={logoUrl}
            alt={branding.brandName}
            fill
            className="object-contain"
          />
        </div>
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-lg flex items-center justify-center font-bold text-white shadow-sm`}
          style={{ backgroundColor: branding.themeColor }}
        >
          {branding.brandName?.charAt(0).toUpperCase() || "V"}
        </div>
      )}
      {showText && <span className={`font-bold ${textSizeClasses[size]}`}>{branding.brandName}</span>}
    </div>
  )
}
