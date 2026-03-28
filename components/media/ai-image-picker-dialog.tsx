"use client"

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Wand2, Upload, Wallet } from "lucide-react"
import { AI_IMAGE_PROMPT_MAX_LENGTH } from "@/lib/ai-image-generation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export type AiImagePickerDialogProps = {
  /** e.g. "Player image" or "Update Hero Background" */
  dialogTitle: string
  onImageUrl: (url: string) => void | Promise<void>
  children: ReactNode
  disabled?: boolean
  /** When set, passed to POST /api/upload as `subdir` (e.g. event hero/player assets). */
  uploadSubdir?: string
}

/**
 * Upload (free) or AI-generate (wallet debit) — same UX as studio branding landing images.
 */
export function AiImagePickerDialog({
  dialogTitle,
  onImageUrl,
  children,
  disabled,
  uploadSubdir,
}: AiImagePickerDialogProps) {
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [aiPrice, setAiPrice] = useState<number | null>(null)

  const { data: walletJson, mutate: mutateWallet, isLoading: walletLoading } = useSWR(
    disabled ? null : "/api/wallets",
    fetcher,
    { revalidateOnFocus: true },
  )
  const walletBalance = Number((walletJson?.wallet as { balance?: number } | undefined)?.balance ?? 0)

  useEffect(() => {
    if (disabled) return
    fetch("/api/generate-image")
      .then((res) => res.json())
      .then((data) => setAiPrice(data.price ?? null))
      .catch(() => setAiPrice(null))
  }, [disabled])

  const canAffordAi = !walletLoading && aiPrice !== null && walletBalance >= aiPrice

  const refreshWallet = () => mutateWallet()

  const handleFileUpload = useCallback(
    async (file: File) => {
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
        if (uploadSubdir) {
          formData.append("subdir", uploadSubdir)
        }
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
          await onImageUrl(data.url)
          setDialogOpen(false)
          setError("")
        }
      } catch {
        setError("Failed to upload image. Please try again.")
      } finally {
        setUploading(false)
      }
    },
    [onImageUrl, uploadSubdir],
  )

  const handleGenerate = async () => {
    const trimmed = prompt.trim()
    if (!trimmed) return
    if (trimmed.length > AI_IMAGE_PROMPT_MAX_LENGTH) {
      setError(`Prompt is too long (max ${AI_IMAGE_PROMPT_MAX_LENGTH} characters).`)
      return
    }
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
        body: JSON.stringify({ prompt: trimmed }),
      })
      const data = (await res.json()) as { error?: string; imageUrl?: string }
      if (data.error) {
        setError(data.error)
        return
      }
      if (data.imageUrl) {
        await onImageUrl(data.imageUrl)
        setDialogOpen(false)
        setPrompt("")
        setError("")
        await refreshWallet()
      }
    } catch {
      setError("Failed to generate image. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const file = e.dataTransfer.files[0]
      if (file) void handleFileUpload(file)
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragActive(false)
  }, [])

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open)
        setError("")
      }}
    >
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>Upload your own image or generate one with AI</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Upload Image (Free)</Label>
            <div
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"
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
                  <p className="text-sm font-medium text-foreground">Drop an image here or click to browse</p>
                  <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, GIF up to 4MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleFileUpload(file)
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
              maxLength={AI_IMAGE_PROMPT_MAX_LENGTH}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {prompt.length} / {AI_IMAGE_PROMPT_MAX_LENGTH} characters
            </p>
            {!canAffordAi && aiPrice !== null && !walletLoading && (
              <p className="text-xs text-destructive">
                Insufficient wallet balance (₹{(walletBalance / 100).toFixed(0)}). Top up at least ₹
                {(aiPrice / 100).toFixed(0)} to use AI generation.
              </p>
            )}
            <Button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={generating || walletLoading || !prompt.trim() || !canAffordAi}
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

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
