"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Header } from "@/components/dashboard/header"
import { BrandingForm } from "@/components/branding/branding-form"
import { BrandingPreview } from "@/components/branding/branding-preview"
import { LandingImageEditor } from "@/components/branding/landing-image-editor"
import type { Branding } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function StudioBrandingPage() {
  const { data, error, mutate, isLoading } = useSWR("/api/studio/branding", fetcher)
  const [localBranding, setLocalBranding] = useState<Branding | null>(null)

  const initialBranding = data?.branding || {
    id: "new",
    userId: "new",
    brandName: "",
    themeColor: "#10b981",
    accentColor: "#059669",
    metaTitle: "",
    metaDescription: "",
    selectedTheme: "modern_emerald",
    heroImage: "",
    aboutImage: "",
    services: [],
    eventTypes: [],
    galleryImages: [],
    testimonials: [],
    hasGatewayConfig: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Branding

  useEffect(() => {
    if (data?.branding) {
      setLocalBranding(data.branding)
    } else if (!isLoading && !data?.branding) {
      setLocalBranding(initialBranding)
    }
  }, [data, isLoading])

  const handleSave = async (updates?: Partial<Branding>) => {
    const finalBranding = updates ? { ...localBranding, ...updates } : localBranding
    if (!finalBranding) return

    try {
      mutate({ branding: finalBranding }, false)
      const res = await fetch("/api/studio/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalBranding),
      })
      if (res.ok) {
        toast.success("Branding updated successfully")
        mutate()
      } else {
        toast.error("Failed to update branding")
      }
    } catch (err) {
      toast.error("An error occurred while saving")
    }
  }

  const currentBranding = localBranding || initialBranding

  return (
    <div className="flex flex-col">
      <Header title="Branding" subtitle="Customize your white-label platform" />
      <main className="flex-1 p-6">
        {isLoading && !localBranding ? (
          <div className="flex h-96 items-center justify-center">Loading branding...</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <BrandingForm 
                branding={currentBranding} 
                onSave={() => handleSave()} 
                onChange={setLocalBranding}
              />
              <LandingImageEditor 
                branding={currentBranding} 
                onBrandingUpdate={(updates) => {
                  const updated = { ...currentBranding, ...updates }
                  setLocalBranding(updated)
                  handleSave(updates)
                }} 
              />
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <BrandingPreview branding={currentBranding} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
