"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Wand2, Upload, Trash2, ImageIcon, RotateCcw } from "lucide-react"
import type { Branding, BrandingEventType, BrandingGalleryImage } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ImageItemProps {
  label: string
  currentSrc?: string
  onUpdate: (newSrc: string) => void
  aspectRatio?: string
}

function ImageItem({ label, currentSrc, onUpdate, aspectRatio = "aspect-video" }: ImageItemProps) {
  const [generating, setGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [urlInput, setUrlInput] = useState("")

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.imageUrl) {
        onUpdate(data.imageUrl)
        setDialogOpen(false)
        setPrompt("")
      }
    } catch {
      console.error("Failed to generate image")
    } finally {
      setGenerating(false)
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onUpdate(urlInput.trim())
      setUrlInput("")
      setDialogOpen(false)
    }
  }

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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Wand2 className="mr-2 h-4 w-4" />
            Update Image
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update {label}</DialogTitle>
            <DialogDescription>Generate a new image with AI or provide a URL</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* AI Generate */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Generate with AI</Label>
              <Textarea
                placeholder="Describe the image you want... e.g. 'Beautiful Indian wedding ceremony with floral decorations, warm lighting, professional photography'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <Button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full"
                style={{ backgroundColor: "hsl(152 76% 46%)" }}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-popover px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* URL Input */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()} variant="outline">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface LandingImageEditorProps {
  branding: Branding
  onBrandingUpdate: (updates: Partial<Branding>) => void
}

export function LandingImageEditor({ branding, onBrandingUpdate }: LandingImageEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Landing Page Images</CardTitle>
        <CardDescription>
          Update images on your landing page using AI generation or custom URLs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Hero & About */}
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

        {/* Event Types */}
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

        {/* Gallery */}
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
