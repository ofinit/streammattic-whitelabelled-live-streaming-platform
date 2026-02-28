"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Wand2, Upload, ImageIcon, Wallet } from "lucide-react"
import type { Branding, BrandingEventType, BrandingGalleryImage } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ImageItemProps {
  label: string
  currentSrc?: string
  onUpdate: (newSrc: string) => void
  aspectRatio?: string
  aiPrice: number | null
  walletBalance: number
}

function ImageItem({ label, currentSrc, onUpdate, aspectRatio = "aspect-video", aiPrice, walletBalance }: ImageItemProps) {
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canAffordAi = aiPrice !== null && walletBalance >= aiPrice

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    if (!canAffordAi) {
      setError(`Insufficient balance. You need ₹${aiPrice !== null ? (aiPrice / 100).toFixed(0) : "?"}.`)
      return
    }
    setGenerating(true)
    setError("")
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, walletBalance }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }
      if (data.imageUrl) {
        onUpdate(data.imageUrl)
        setDialogOpen(false)
        setPrompt("")
        setError("")
      }
    } catch {
      setError("Failed to generate image. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Allowed: JPG, PNG, WebP, GIF")
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("File too large. Maximum size is 4MB.")
      return
    }

    setUploading(true)
    setError("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }
      if (data.url) {
        onUpdate(data.url)
        setDialogOpen(false)
        setError("")
      }
    } catch {
      setError("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragActive(false)
  }, [])

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

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); setError(""); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <ImageIcon className="mr-2 h-4 w-4" />
            Update Image
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update {label}</DialogTitle>
            <DialogDescription>Upload your own image or generate one with AI</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* File Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Upload Image (Free)</Label>
              <div
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-border"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mb-2 h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground/60" />
                    <p className="text-sm font-medium text-foreground">
                      Drop an image here or click to browse
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      JPG, PNG, WebP, GIF up to 4MB
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-popover px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* AI Generate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Generate with AI</Label>
                {aiPrice !== null && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Wallet className="h-3 w-3" />
                    Cost: ₹{(aiPrice / 100).toFixed(0)} per image
                  </span>
                )}
              </div>
              <Textarea
                placeholder="Describe the image you want... e.g. 'Beautiful Indian wedding ceremony with floral decorations, warm lighting, professional photography'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="resize-none"
              />
              {!canAffordAi && aiPrice !== null && (
                <p className="text-xs text-destructive">
                  Insufficient wallet balance (₹{(walletBalance / 100).toFixed(0)}). Top up at least ₹{(aiPrice / 100).toFixed(0)} to use AI generation.
                </p>
              )}
              <Button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim() || !canAffordAi}
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
                    Generate Image{aiPrice !== null ? ` (₹${(aiPrice / 100).toFixed(0)})` : ""}
                  </>
                )}
              </Button>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}
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
  const [aiPrice, setAiPrice] = useState<number | null>(null)
  // Use mock wallet balance from branding context (in a real app, this comes from wallet API)
  const walletBalance = 15000 // mock: 150 INR in paisa

  useEffect(() => {
    fetch("/api/generate-image")
      .then((res) => res.json())
      .then((data) => setAiPrice(data.price ?? null))
      .catch(() => setAiPrice(null))
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Landing Page Images</CardTitle>
            <CardDescription className="mt-1">
              Upload your own images for free, or generate with AI from your wallet balance.
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-card px-3 py-1.5">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">₹{(walletBalance / 100).toFixed(0)}</span>
            </div>
            {aiPrice !== null && (
              <span className="text-xs text-muted-foreground">
                AI generation: ₹{(aiPrice / 100).toFixed(0)} / image
              </span>
            )}
          </div>
        </div>
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
              aiPrice={aiPrice}
              walletBalance={walletBalance}
            />
            <ImageItem
              label="About Section"
              currentSrc={branding.aboutImage}
              onUpdate={(src) => onBrandingUpdate({ aboutImage: src })}
              aspectRatio="aspect-[4/3]"
              aiPrice={aiPrice}
              walletBalance={walletBalance}
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
                  aiPrice={aiPrice}
                  walletBalance={walletBalance}
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
                  aiPrice={aiPrice}
                  walletBalance={walletBalance}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
