"use client"

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
  const branding = data?.branding

  const handleSave = async (updates: Partial<Branding>) => {
    try {
      mutate({ branding: { ...branding, ...updates } }, false)
      const res = await fetch("/api/studio/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...branding, ...updates }),
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

  return (
    <div className="flex flex-col">
      <Header title="Branding" subtitle="Customize your white-label platform" />
      <main className="flex-1 p-6">
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">Loading branding...</div>
        ) : (
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
        )}
      </main>
    </div>
  )
}
