"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { X, ChevronLeft, ChevronRight, Play, Pause, ZoomIn, ZoomOut } from "lucide-react"

interface GalleryLightboxProps {
  images: { id: string; url: string; contentType: string | null }[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate: (index: number) => void
  albumTitle?: string
}

export function GalleryLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  albumTitle,
}: GalleryLightboxProps) {
  const [isSlideshowActive, setIsSlideshowActive] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const currentImage = images[currentIndex]
  const totalImages = images.length

  const goToNext = useCallback(() => {
    const nextIndex = currentIndex === totalImages - 1 ? 0 : currentIndex + 1
    onNavigate(nextIndex)
    setIsLoading(true)
    setIsZoomed(false)
  }, [currentIndex, totalImages, onNavigate])

  const goToPrevious = useCallback(() => {
    const prevIndex = currentIndex === 0 ? totalImages - 1 : currentIndex - 1
    onNavigate(prevIndex)
    setIsLoading(true)
    setIsZoomed(false)
  }, [currentIndex, totalImages, onNavigate])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "ArrowRight":
          goToNext()
          break
        case "ArrowLeft":
          goToPrevious()
          break
        case " ":
          e.preventDefault()
          setIsSlideshowActive((prev) => !prev)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose, goToNext, goToPrevious])

  // Slideshow auto-advance
  useEffect(() => {
    if (!isSlideshowActive || !isOpen) return

    const interval = setInterval(() => {
      goToNext()
    }, 4000)

    return () => clearInterval(interval)
  }, [isSlideshowActive, isOpen, goToNext])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
      setIsSlideshowActive(false)
      setIsZoomed(false)
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen || !currentImage) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 text-white/90">
          <span className="text-sm font-medium">
            {currentIndex + 1} / {totalImages}
          </span>
          {albumTitle && (
            <span className="hidden text-sm text-white/60 sm:inline">· {albumTitle}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Zoom toggle */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={isZoomed ? "Zoom out" : "Zoom in"}
          >
            {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
          </button>
          {/* Slideshow toggle */}
          <button
            onClick={() => setIsSlideshowActive(!isSlideshowActive)}
            className={cn(
              "rounded-full p-2 transition-colors hover:bg-white/10",
              isSlideshowActive ? "text-primary" : "text-white/70 hover:text-white"
            )}
            aria-label={isSlideshowActive ? "Pause slideshow" : "Start slideshow"}
          >
            {isSlideshowActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            className="ml-2 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 sm:px-16">
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        )}

        {/* Navigation arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 z-10 rounded-full bg-black/40 p-2 text-white/80 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white sm:left-4 sm:p-3"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-2 z-10 rounded-full bg-black/40 p-2 text-white/80 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white sm:right-4 sm:p-3"
          aria-label="Next image"
        >
          <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>

        {/* Image */}
        <div
          className={cn(
            "relative max-h-full max-w-full transition-transform duration-300",
            isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
          )}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage.url}
            alt={`${albumTitle || "Photo"} ${currentIndex + 1} of ${totalImages}`}
            className={cn(
              "max-h-[calc(100vh-180px)] max-w-full object-contain transition-all duration-300",
              isZoomed ? "scale-150" : "scale-100",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="border-t border-white/10 bg-black/50 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => {
                onNavigate(idx)
                setIsLoading(true)
                setIsZoomed(false)
              }}
              className={cn(
                "relative flex-shrink-0 overflow-hidden rounded transition-all",
                idx === currentIndex
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-black"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="h-14 w-20 object-cover sm:h-16 sm:w-24"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-20 left-1/2 hidden -translate-x-1/2 rounded-full bg-black/60 px-4 py-1 text-xs text-white/60 backdrop-blur-sm sm:block">
        ← → Navigate · Space Slideshow · Esc Close
      </div>
    </div>
  )
}
