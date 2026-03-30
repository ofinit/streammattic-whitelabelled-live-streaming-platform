"use client"

import { useState, useCallback } from "react"
import Cropper, { type Area } from "react-easy-crop"
import "react-easy-crop/react-easy-crop.css"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { getCroppedImageBlob } from "@/lib/crop-image"

export type CircularProfileCropDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onConfirm: (blob: Blob) => void | Promise<void>
  title?: string
}

export function CircularProfileCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onConfirm,
  title = "Position photo in circle",
}: CircularProfileCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setSubmitting(true)
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels)
      await onConfirm(blob)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && !submitting) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Drag to reposition and use the slider to zoom. The circle matches the profile photo on the watch page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative mx-auto h-[min(52vw,320px)] w-full max-w-[320px] overflow-hidden rounded-lg bg-muted">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Zoom</span>
              <span>{zoom.toFixed(2)}×</span>
            </div>
            <Slider value={[zoom]} min={1} max={3} step={0.01} onValueChange={(v) => setZoom(v[0] ?? 1)} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={submitting || !croppedAreaPixels}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              "Apply & upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
