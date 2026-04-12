"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ImageIcon, Wallet } from "lucide-react"
import type { Branding } from "@/lib/types"
import { AiImagePickerDialog } from "@/components/media/ai-image-picker-dialog"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function ImageItem({
  label,
  currentSrc,
  onUpdate,
  aspectRatio = "aspect-video",
}: {
  label: string
  currentSrc?: string
  onUpdate: (newSrc: string) => void
  aspectRatio?: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className={`relative overflow-hidden rounded-lg border border-border/50 bg-card ${aspectRatio}`}>
        {currentSrc && !currentSrc.includes("placeholder.svg") ? (
          <img
            src={currentSrc}
            alt={label}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/30">
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>

      <AiImagePickerDialog dialogTitle={`Update ${label}`} onImageUrl={onUpdate}>
        <Button variant="outline" size="sm" className="w-full" type="button">
          <ImageIcon className="mr-2 h-4 w-4" />
          Update Image
        </Button>
      </AiImagePickerDialog>
    </div>
  )
}

interface LandingImageEditorProps {
  branding: Branding
  onBrandingUpdate: (updates: Partial<Branding>) => void
}

export function LandingImageEditor({ branding, onBrandingUpdate }: LandingImageEditorProps) {
  const [aiPrice, setAiPrice] = useState<number | null>(null)
  const [aiShowPricingLine, setAiShowPricingLine] = useState(false)
  const { data: walletJson, isLoading: walletLoading } = useSWR("/api/wallets", fetcher, { revalidateOnFocus: true })
  const walletBalance = Number((walletJson?.wallet as { balance?: number } | undefined)?.balance ?? 0)

  useEffect(() => {
    fetch("/api/generate-image")
      .then((res) => res.json())
      .then((data: Record<string, unknown>) => {
        setAiPrice(typeof data.price === "number" ? data.price : null)
        const enabled = data.enabled !== false
        const ready = data.backendReady === true
        setAiShowPricingLine(enabled && ready)
      })
      .catch(() => {
        setAiPrice(null)
        setAiShowPricingLine(false)
      })
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Landing Page Images</CardTitle>
            <CardDescription className="mt-1">
              {aiShowPricingLine
                ? "Upload your own images for free, or generate with AI from your wallet balance."
                : "Upload your own images for free. AI generation may be disabled or not configured on the server."}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-card px-3 py-1.5">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {walletLoading ? "…" : `₹${(walletBalance / 100).toFixed(0)}`}
              </span>
            </div>
            {aiShowPricingLine && aiPrice !== null && (
              <span className="text-xs text-muted-foreground">
                AI generation: ₹{(aiPrice / 100).toFixed(0)} / image
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h3 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wide">Hero & About</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <ImageItem
              label="Hero Background"
              currentSrc={branding.heroImage}
              onUpdate={(src) => onBrandingUpdate({ heroImage: src })}
            />
            <ImageItem
              label="About Section"
              currentSrc={branding.aboutImage}
              onUpdate={(src) => onBrandingUpdate({ aboutImage: src })}
              aspectRatio="aspect-[4/3]"
            />
          </div>
        </div>

        {branding.eventTypes && branding.eventTypes.length > 0 && (
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wide">Event Type Images</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {branding.eventTypes.map((evt, idx) => (
                <ImageItem
                  key={evt.id}
                  label={evt.title}
                  currentSrc={evt.image}
                  onUpdate={(src) => {
                    const updated = [...(branding.eventTypes || [])]
                    updated[idx] = { ...updated[idx], image: src }
                    onBrandingUpdate({ eventTypes: updated })
                  }}
                  aspectRatio="aspect-[4/3]"
                />
              ))}
            </div>
          </div>
        )}

        {branding.galleryImages && branding.galleryImages.length > 0 && (
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wide">Gallery Images</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {branding.galleryImages.map((img, idx) => (
                <ImageItem
                  key={img.id}
                  label={img.title}
                  currentSrc={img.src}
                  onUpdate={(src) => {
                    const updated = [...(branding.galleryImages || [])]
                    updated[idx] = { ...updated[idx], src }
                    onBrandingUpdate({ galleryImages: updated })
                  }}
                  aspectRatio="aspect-[3/2]"
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
