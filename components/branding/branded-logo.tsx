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

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {branding.companyLogo ? (
        <div className={`relative ${sizeClasses[size]}`}>
          <Image
            src={branding.companyLogo || "/placeholder.svg"}
            alt={branding.brandName}
            fill
            className="object-contain"
          />
        </div>
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-lg flex items-center justify-center`}
          style={{ backgroundColor: branding.themeColor }}
        >
          <Radio className="h-1/2 w-1/2 text-white" />
        </div>
      )}
      {showText && <span className={`font-bold ${textSizeClasses[size]}`}>{branding.brandName}</span>}
    </div>
  )
}
