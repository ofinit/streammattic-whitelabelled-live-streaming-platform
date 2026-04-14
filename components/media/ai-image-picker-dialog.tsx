"use client"

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Wand2, Upload, Wallet, X } from "lucide-react"
import { AI_IMAGE_PROMPT_MAX_LENGTH } from "@/lib/ai-image-generation"
import { useAuth } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CircularProfileCropDialog } from "@/components/media/circular-profile-crop-dialog"
import { cn } from "@/lib/utils"

async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = (await res.json()) as { error?: string }
      if (data?.error) message = data.error
    } catch {
      // ignore
    }
    throw new Error(message)
  }
  return res.json()
}

export type AiImagePickerDialogProps = {
  /** e.g. "Player image" or "Update Hero Background" */
  dialogTitle: string
  onImageUrl: (url: string) => void | Promise<void>
  children: ReactNode
  disabled?: boolean
  /**
   * Wallet owner used for balance checks and AI debits.
   * - Default: current user
   * - Admin creating/editing for a tenant: pass that tenant's user id to debit their wallet
   */
  walletUserId?: string
  /** When set, passed to POST /api/upload as `subdir` (e.g. event hero/player assets). */
  uploadSubdir?: string
  /**
   * When true (Memorial / Birthday templates), choosing a file opens a circular crop step before upload
   * so the hero image matches the circular profile frame on the watch page.
   */
  circularHeroCrop?: boolean
  /**
   * When true, the free upload zone accepts multiple images and uploads each sequentially (e.g. event photo gallery).
   * Uses 8MB per file to match POST /api/upload. Incompatible with `circularHeroCrop` (crop flow stays single-file).
   */
  allowMultipleUpload?: boolean
  /**
   * Set when this picker is rendered inside another Radix Dialog (e.g. Create/Edit Event → Template).
   * Uses a Popover instead of a second Dialog so the browser file picker works on click (nested modals break native file input).
   */
  nestedInDialog?: boolean
}

/**
 * Upload (free) or AI-generate (wallet debit) — same UX as studio branding landing images.
 */
export function AiImagePickerDialog({
  dialogTitle,
  onImageUrl,
  children,
  disabled,
  walletUserId,
  uploadSubdir,
  circularHeroCrop,
  allowMultipleUpload = false,
  nestedInDialog = false,
}: AiImagePickerDialogProps) {
  const { user } = useAuth()
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const cropObjectUrlRef = useRef<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [aiPrice, setAiPrice] = useState<number | null>(null)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [aiBackendReady, setAiBackendReady] = useState(false)
  const [aiBackend, setAiBackend] = useState<"fal" | "openrouter" | null>(null)
  const [aiMetaLoading, setAiMetaLoading] = useState(true)

  const walletUrl =
    disabled
      ? null
      : walletUserId && walletUserId.trim() !== ""
        ? `/api/wallets?userId=${encodeURIComponent(walletUserId)}`
        : "/api/wallets"

  const {
    data: walletJson,
    error: walletError,
    mutate: mutateWallet,
    isLoading: walletLoading,
  } = useSWR(
    walletUrl,
    fetchJson,
    { revalidateOnFocus: true },
  )
  const walletBalance = Number((walletJson?.wallet as { balance?: number } | undefined)?.balance ?? 0)

  /** Billable wallet owner matches session user — platform admin on own events/branding pays nothing. */
  const effectiveWalletUserId =
    walletUserId && walletUserId.trim() !== "" ? walletUserId.trim() : (user?.id ?? "")
  const isPlatformAdminFreeAi =
    user?.role === "admin" && !!user?.id && effectiveWalletUserId === user.id
  const showAiProviderNamesToUser = user?.role === "admin"

  useEffect(() => {
    if (disabled) {
      setAiMetaLoading(false)
      return
    }
    setAiMetaLoading(true)
    fetch("/api/generate-image")
      .then((res) => res.json())
      .then((data: Record<string, unknown>) => {
        setAiPrice(typeof data.price === "number" ? data.price : null)
        setAiEnabled(data.enabled !== false)
        setAiBackendReady(data.backendReady === true)
        const b = data.backend
        setAiBackend(b === "openrouter" ? "openrouter" : b === "fal" ? "fal" : null)
      })
      .catch(() => {
        setAiPrice(null)
        setAiEnabled(true)
        setAiBackendReady(false)
        setAiBackend(null)
      })
      .finally(() => setAiMetaLoading(false))
  }, [disabled])

  const showAiSection = !disabled && !aiMetaLoading && aiEnabled && aiBackendReady
  const showAiBlockedByAdmin = !disabled && !aiMetaLoading && !aiEnabled
  const showAiServerMisconfigured = !disabled && !aiMetaLoading && aiEnabled && !aiBackendReady

  const canAffordAi =
    isPlatformAdminFreeAi ||
    (!walletLoading && !walletError && aiPrice !== null && walletBalance >= aiPrice)

  const refreshWallet = () => mutateWallet()

  const endCircularCrop = useCallback(() => {
    if (cropObjectUrlRef.current) {
      URL.revokeObjectURL(cropObjectUrlRef.current)
      cropObjectUrlRef.current = null
    }
    setCropImageSrc(null)
  }, [])

  const startCircularCrop = useCallback(
    (file: File) => {
      setError("")
      if (cropObjectUrlRef.current) {
        URL.revokeObjectURL(cropObjectUrlRef.current)
      }
      const url = URL.createObjectURL(file)
      cropObjectUrlRef.current = url
      setCropImageSrc(url)
      setDialogOpen(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [],
  )

  const handleCroppedBlob = useCallback(
    async (blob: Blob) => {
      const file = new File([blob], "hero-profile.jpg", { type: "image/jpeg" })
      try {
        const formData = new FormData()
        formData.append("file", file)
        if (uploadSubdir) {
          formData.append("subdir", uploadSubdir)
        }
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        })
        const data = await res.json()
        if (data.error) {
          toast.error(data.error)
          return
        }
        if (data.url) {
          await onImageUrl(data.url)
          endCircularCrop()
        }
      } catch {
        toast.error("Failed to upload image. Please try again.")
      }
    },
    [endCircularCrop, onImageUrl, uploadSubdir],
  )

  const maxBytesFreeUpload = allowMultipleUpload && !circularHeroCrop ? 8 * 1024 * 1024 : 4 * 1024 * 1024

  const validateImageFile = useCallback((file: File): string | null => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return `${file.name}: use JPG, PNG, WebP, or GIF`
    }
    if (file.size > maxBytesFreeUpload) {
      const mb = maxBytesFreeUpload / (1024 * 1024)
      return `${file.name}: max ${mb}MB per file`
    }
    return null
  }, [maxBytesFreeUpload])

  const postOneUpload = useCallback(
    async (file: File): Promise<{ ok: true; url: string } | { ok: false; message: string }> => {
      const formData = new FormData()
      formData.append("file", file)
      if (uploadSubdir) {
        formData.append("subdir", uploadSubdir)
      }
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      })
      const data = (await res.json()) as { error?: string; url?: string }
      if (data.error) {
        return { ok: false, message: `${file.name}: ${data.error}` }
      }
      if (data.url) {
        return { ok: true, url: data.url }
      }
      return { ok: false, message: `${file.name}: no URL returned` }
    },
    [uploadSubdir],
  )

  const handleMultipleFileUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return
      const validationErrors: string[] = []
      for (const f of files) {
        const v = validateImageFile(f)
        if (v) validationErrors.push(v)
      }
      if (validationErrors.length === files.length) {
        setError(validationErrors[0] ?? "No valid images")
        return
      }

      setUploading(true)
      setError("")
      let successCount = 0
      const uploadErrors: string[] = [...validationErrors]
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]!
          const v = validateImageFile(file)
          if (v) continue
          const result = await postOneUpload(file)
          if (result.ok) {
            await onImageUrl(result.url)
            successCount++
          } else {
            uploadErrors.push(result.message)
          }
        }
        if (successCount > 0) {
          setDialogOpen(false)
          setError("")
          toast.success(
            successCount === 1
              ? "1 image added"
              : `${successCount} images added`,
          )
          if (uploadErrors.length > 0) {
            toast.error(`Some files skipped: ${uploadErrors.slice(0, 4).join("; ")}${uploadErrors.length > 4 ? "…" : ""}`)
          }
        } else {
          setError(uploadErrors[0] ?? "Upload failed")
        }
      } catch {
        setError("Failed to upload images. Please try again.")
      } finally {
        setUploading(false)
      }
    },
    [onImageUrl, postOneUpload, validateImageFile],
  )

  const handleFileUpload = useCallback(
    async (file: File) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
      if (!allowedTypes.includes(file.type)) {
        setError("Invalid file type. Allowed: JPG, PNG, WebP, GIF")
        return
      }
      if (file.size > maxBytesFreeUpload) {
        const mb = maxBytesFreeUpload / (1024 * 1024)
        setError(`File too large. Maximum size is ${mb}MB.`)
        return
      }

      if (circularHeroCrop) {
        startCircularCrop(file)
        return
      }

      setUploading(true)
      setError("")
      try {
        const result = await postOneUpload(file)
        if (!result.ok) {
          setError(result.message)
          return
        }
        await onImageUrl(result.url)
        if (allowMultipleUpload) {
          toast.success("1 image added")
        }
        setDialogOpen(false)
        setError("")
      } catch {
        setError("Failed to upload image. Please try again.")
      } finally {
        setUploading(false)
      }
    },
    [allowMultipleUpload, circularHeroCrop, maxBytesFreeUpload, onImageUrl, postOneUpload, startCircularCrop],
  )

  const handleGenerate = async () => {
    const trimmed = prompt.trim()
    if (!trimmed) return
    if (trimmed.length > AI_IMAGE_PROMPT_MAX_LENGTH) {
      setError(`Prompt is too long (max ${AI_IMAGE_PROMPT_MAX_LENGTH} characters).`)
      return
    }
    if (!canAffordAi) {
      if (walletError) {
        setError(walletError instanceof Error ? walletError.message : "Failed to load wallet balance.")
        return
      }
      setError(`Insufficient balance. You need ₹${aiPrice !== null ? (aiPrice / 100).toFixed(0) : "?"}.`)
      return
    }
    setGenerating(true)
    setError("")
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          userId: walletUserId && walletUserId.trim() !== "" ? walletUserId : undefined,
        }),
      })
      const data = (await res.json()) as { error?: string; imageUrl?: string }
      if (data.error) {
        setError(data.error)
        return
      }
      if (data.imageUrl) {
        await onImageUrl(data.imageUrl)
        if (allowMultipleUpload) {
          toast.success("Image added")
        }
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
      const raw = Array.from(e.dataTransfer.files)
      const files = raw.filter((f) =>
        ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type),
      )
      if (files.length === 0) return
      if (allowMultipleUpload && !circularHeroCrop) {
        void handleMultipleFileUpload(files)
      } else {
        void handleFileUpload(files[0]!)
      }
    },
    [allowMultipleUpload, circularHeroCrop, handleFileUpload, handleMultipleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragActive(false)
  }, [])

  const descriptionText =
    !disabled && aiMetaLoading
      ? "Upload your own image or generate one with AI"
      : showAiSection || showAiServerMisconfigured
        ? "Upload your own image or generate one with AI"
        : showAiBlockedByAdmin
          ? "Upload an image for this slot (AI generation is disabled by administrators)."
          : "Upload an image for this slot."

  const onOpenChangePicker = (next: boolean) => {
    setDialogOpen(next)
    setError("")
  }

  const renderPickerForm = () => (
            <div className="space-y-6 pt-2">
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  {allowMultipleUpload && !circularHeroCrop ? "Upload images (Free)" : "Upload Image (Free)"}
                </Label>
                {circularHeroCrop ? (
                  <p className="text-xs text-muted-foreground">
                    This template uses a circular profile photo on the watch page. After you choose a file, you can zoom and
                    align the image inside the circle before uploading.
                  </p>
                ) : null}
                {uploading ? (
                  <div
                    className={`flex min-h-[140px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 ${
                      dragActive ? "border-primary bg-primary/5" : "border-border/50"
                    }`}
                  >
                    <Loader2 className="mb-2 h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <label
                    className={cn(
                      "flex min-h-[140px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors",
                      dragActive ? "border-primary bg-primary/5" : "border-border/50 hover:border-border",
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple={Boolean(allowMultipleUpload && !circularHeroCrop)}
                      className="hidden"
                      aria-label={
                        allowMultipleUpload && !circularHeroCrop ? "Choose images to upload" : "Choose image to upload"
                      }
                      onChange={(e) => {
                        const list = e.target.files
                        e.target.value = ""
                        if (!list?.length) return
                        if (allowMultipleUpload && !circularHeroCrop) {
                          void handleMultipleFileUpload(Array.from(list))
                        } else {
                          const file = list[0]
                          if (file) void handleFileUpload(file)
                        }
                      }}
                    />
                    <div className="flex flex-col items-center justify-center p-6">
                      <Upload className="mb-2 h-8 w-8 text-muted-foreground/60" />
                      <p className="text-sm font-medium text-foreground">
                        {allowMultipleUpload && !circularHeroCrop
                          ? "Drop images here or click to browse"
                          : "Drop an image here or click to browse"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {allowMultipleUpload && !circularHeroCrop
                          ? "JPG, PNG, WebP, GIF up to 8MB each — select multiple"
                          : "JPG, PNG, WebP, GIF up to 4MB"}
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {showAiSection ? (
                <>
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
                      {isPlatformAdminFreeAi ? (
                        <span className="text-xs text-muted-foreground">Free for platform admin</span>
                      ) : (
                        aiPrice !== null && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Wallet className="h-3 w-3" />
                            Cost: ₹{(aiPrice / 100).toFixed(0)} per image
                            {showAiProviderNamesToUser && aiBackend === "openrouter" ? (
                              <span className="text-muted-foreground/80"> · OpenRouter</span>
                            ) : showAiProviderNamesToUser && aiBackend === "fal" ? (
                              <span className="text-muted-foreground/80"> · Fal</span>
                            ) : null}
                          </span>
                        )
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
                    {!canAffordAi && aiPrice !== null && !walletLoading && !isPlatformAdminFreeAi && (
                      <p className="text-xs text-destructive">
                        Insufficient wallet balance (₹{(walletBalance / 100).toFixed(0)}). Top up at least ₹
                        {(aiPrice / 100).toFixed(0)} to use AI generation.
                      </p>
                    )}
                    <Button
                      type="button"
                      onClick={() => void handleGenerate()}
                      disabled={
                        generating ||
                        walletLoading ||
                        !prompt.trim() ||
                        !canAffordAi ||
                        (!isPlatformAdminFreeAi && aiPrice === null)
                      }
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
                          {isPlatformAdminFreeAi ? "" : aiPrice !== null ? ` (₹${(aiPrice / 100).toFixed(0)})` : ""}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : showAiServerMisconfigured ? (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-popover px-2 text-muted-foreground">or</span>
                    </div>
                  </div>
                  <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    {showAiProviderNamesToUser ? (
                      <>
                        AI generation is enabled but the server is not configured for the selected provider. Use upload, or set
                        API keys (Fal or OpenRouter) and redeploy.
                      </>
                    ) : (
                      <>
                        AI generation is enabled but the server is not fully configured. Use upload, or contact your
                        administrator.
                      </>
                    )}
                  </p>
                </>
              ) : null}

              {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            </div>
  )

  return (
    <>
      {nestedInDialog ? (
        <Popover open={dialogOpen} onOpenChange={onOpenChangePicker} modal={false}>
          <PopoverTrigger asChild disabled={disabled}>
            {children}
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            sideOffset={8}
            collisionPadding={16}
            className={cn(
              "z-[100] w-[min(calc(100vw-1.5rem),28rem)] max-h-[min(90dvh,640px)] overflow-y-auto border bg-popover p-0 text-popover-foreground shadow-lg",
            )}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <div className="relative p-6 pt-4">
              <button
                type="button"
                className="ring-offset-background focus:ring-ring absolute right-3 top-3 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
                onClick={() => onOpenChangePicker(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex flex-col gap-2 pr-8 text-left">
                <h2 className="text-lg font-semibold leading-none">{dialogTitle}</h2>
                <p className="text-muted-foreground text-sm">{descriptionText}</p>
              </div>
              {renderPickerForm()}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <Dialog open={dialogOpen} onOpenChange={onOpenChangePicker}>
          <DialogTrigger asChild disabled={disabled}>
            {children}
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>{descriptionText}</DialogDescription>
            </DialogHeader>
            {renderPickerForm()}
          </DialogContent>
        </Dialog>
      )}

      {cropImageSrc ? (
        <CircularProfileCropDialog
          open
          imageSrc={cropImageSrc}
          onOpenChange={(open) => {
            if (!open) endCircularCrop()
          }}
          onConfirm={handleCroppedBlob}
          title="Position photo in circle"
        />
      ) : null}
    </>
  )
}
