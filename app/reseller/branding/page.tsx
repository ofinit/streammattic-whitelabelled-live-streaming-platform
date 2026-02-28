"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { BrandingForm } from "@/components/branding/branding-form"
import { BrandingPreview } from "@/components/branding/branding-preview"
import { LandingImageEditor } from "@/components/branding/landing-image-editor"
import { mockBranding } from "@/lib/mock-data"
import type { Branding } from "@/lib/types"

export default function ResellerBrandingPage() {
  const [branding, setBranding] = useState<Branding>(mockBranding)

  const handleSave = (updates: Partial<Branding>) => {
    setBranding({ ...branding, ...updates })
  }

  return (
    <div className="flex flex-col">
      <Header title="Branding" subtitle="Customize your white-label platform" />
      <main className="flex-1 p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <BrandingForm branding={branding} onSave={handleSave} />
            <LandingImageEditor branding={branding} onBrandingUpdate={handleSave} />
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <BrandingPreview branding={branding} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
