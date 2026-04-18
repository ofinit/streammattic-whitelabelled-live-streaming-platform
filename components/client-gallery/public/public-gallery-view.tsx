"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { PublicAlbumPayload } from "@/lib/client-gallery-album-service"
import { DEFAULT_GALLERY_TEMPLATE_ID } from "@/lib/client-gallery-templates"
import { GalleryLightbox } from "./gallery-lightbox"
import { PublicGalleryPinGate } from "./public-gallery-pin-gate"
import { Calendar, MapPin, Play, ZoomIn } from "lucide-react"

function isVideoContentType(contentType: string | null): boolean {
  if (!contentType) return false
  return contentType.toLowerCase().trim().startsWith("video/")
}

function formatRange(startsAt: string | null, endsAt: string | null): string | null {
  const a = startsAt ? new Date(startsAt) : null
  const b = endsAt ? new Date(endsAt) : null
  if (a && !Number.isNaN(a.getTime()) && b && !Number.isNaN(b.getTime())) {
    return `${a.toLocaleDateString(undefined, { dateStyle: "medium" })} – ${b.toLocaleDateString(undefined, { dateStyle: "medium" })}`
  }
  if (a && !Number.isNaN(a.getTime())) return a.toLocaleDateString(undefined, { dateStyle: "medium" })
  return null
}

interface PhotoTileProps {
  img: { id: string; url: string; contentType: string | null }
  index: number
  onClick: () => void
  className?: string
  aspect?: "square" | "portrait" | "landscape" | "auto"
}

function PhotoTile({ img, index, onClick, className, aspect = "square" }: PhotoTileProps) {
  const isVideo = isVideoContentType(img.contentType)
  const aspectClasses = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
    auto: "",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isVideo ? `Play video ${index + 1}` : `View image ${index + 1}`}
      className={cn(
        "group relative overflow-hidden rounded-lg bg-zinc-100 transition-all duration-300",
        "hover:shadow-lg hover:shadow-zinc-400/35",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        aspectClasses[aspect],
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.url}
        alt={`Photo ${index + 1}`}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/30 group-hover:opacity-100">
        <div className="rounded-full bg-white/90 p-3 text-black shadow-lg backdrop-blur-sm">
          {isVideo ? (
            <Play className="h-5 w-5 fill-current" aria-hidden />
          ) : (
            <ZoomIn className="h-5 w-5" strokeWidth={2} aria-hidden />
          )}
        </div>
      </div>
    </button>
  )
}

interface GalleryLayoutProps {
  payload: PublicAlbumPayload
  onImageClick: (index: number) => void
}

// Enhanced Classic Grid with masonry feel
function ClassicGrid({ payload, onImageClick }: GalleryLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 px-4 py-6 backdrop-blur-sm sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{payload.title}</h1>
          <AlbumMeta payload={payload} className="mt-3" />
        </div>
      </header>

      {/* Gallery Grid */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {payload.images.map((img, idx) => (
            <PhotoTile key={img.id} img={img} index={idx} onClick={() => onImageClick(idx)} />
          ))}
        </div>
      </main>
    </div>
  )
}

// Hero Ribbon with large featured image
function HeroRibbon({ payload, onImageClick }: GalleryLayoutProps) {
  const [featured, ...rest] = payload.images

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative">
        {featured && (
          <div className="relative h-[50vh] min-h-[300px] w-full overflow-hidden sm:h-[60vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.url}
              alt="Featured"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <button
              type="button"
              onClick={() => onImageClick(0)}
              aria-label={isVideoContentType(featured.contentType) ? "Play featured video" : "View featured image"}
              className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity hover:opacity-100"
            >
              <div className="rounded-full bg-white/20 p-4 text-white backdrop-blur-md">
                {isVideoContentType(featured.contentType) ? (
                  <Play className="h-8 w-8 fill-current" aria-hidden />
                ) : (
                  <ZoomIn className="h-8 w-8" strokeWidth={2} aria-hidden />
                )}
              </div>
            </button>
          </div>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-20 sm:px-8 sm:pb-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">{payload.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-white/80">
              {payload.eventType && <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">{payload.eventType}</span>}
              {payload.location && (
                <span className="flex items-center gap-1 text-sm">
                  <MapPin className="h-4 w-4" /> {payload.location}
                </span>
              )}
              {formatRange(payload.startsAt, payload.endsAt) && (
                <span className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4" /> {formatRange(payload.startsAt, payload.endsAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {rest.map((img, idx) => (
            <PhotoTile key={img.id} img={img} index={idx + 1} onClick={() => onImageClick(idx + 1)} />
          ))}
        </div>
      </main>
    </div>
  )
}

// Masonry Flow - Pinterest style
function MasonryFlow({ payload, onImageClick }: GalleryLayoutProps) {
  const columns = 3
  const columnImages: typeof payload.images[] = Array.from({ length: columns }, () => [])

  payload.images.forEach((img, idx) => {
    columnImages[idx % columns].push(img)
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 px-4 py-6 backdrop-blur-sm sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{payload.title}</h1>
          <AlbumMeta payload={payload} className="mt-3" />
        </div>
      </header>

      {/* Masonry Gallery */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex gap-3 md:gap-4">
          {columnImages.map((column, colIdx) => (
            <div key={colIdx} className="flex flex-1 flex-col gap-3 md:gap-4">
              {column.map((img, idx) => {
                const globalIndex = colIdx + idx * columns
                return (
                  <PhotoTile
                    key={img.id}
                    img={img}
                    index={globalIndex}
                    onClick={() => onImageClick(globalIndex)}
                    aspect="auto"
                    className="w-full"
                  />
                )
              })}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

// Bento Modern - Asymmetric grid
function BentoModern({ payload, onImageClick }: GalleryLayoutProps) {
  const [hero, second, third, ...rest] = payload.images

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 px-4 py-6 backdrop-blur-sm sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{payload.title}</h1>
          <AlbumMeta payload={payload} className="mt-3" />
        </div>
      </header>

      {/* Bento Grid */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        {/* Hero + side tiles */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {hero && (
            <PhotoTile
              img={hero}
              index={0}
              onClick={() => onImageClick(0)}
              aspect="square"
              className="md:col-span-2 md:aspect-auto md:min-h-[400px]"
            />
          )}
          <div className="flex flex-col gap-4">
            {second && (
              <PhotoTile
                img={second}
                index={1}
                onClick={() => onImageClick(1)}
                aspect="square"
                className="flex-1"
              />
            )}
            {third && (
              <PhotoTile
                img={third}
                index={2}
                onClick={() => onImageClick(2)}
                aspect="square"
                className="flex-1"
              />
            )}
          </div>
        </div>

        {/* Rest of gallery */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {rest.map((img, idx) => (
            <PhotoTile key={img.id} img={img} index={idx + 3} onClick={() => onImageClick(idx + 3)} />
          ))}
        </div>
      </main>
    </div>
  )
}

// Wedding Soft - Romantic elegant design
function WeddingSoft({ payload, onImageClick }: GalleryLayoutProps) {
  const [hero, ...rest] = payload.images

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-zinc-50/80">
      {/* Decorative header */}
      <header className="relative overflow-hidden px-4 py-12 text-center sm:px-8 sm:py-16">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-rose-200/60 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-violet-200/50 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-rose-600">
            Wedding Gallery
          </p>
          <h1 className="mt-4 font-serif text-3xl font-light italic tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {payload.title}
          </h1>
          <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {payload.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-rose-500/70" /> {payload.location}
              </span>
            )}
            {formatRange(payload.startsAt, payload.endsAt) && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-rose-500/70" /> {formatRange(payload.startsAt, payload.endsAt)}
              </span>
            )}
          </div>
          {payload.description && (
            <p className="mx-auto mt-4 max-w-2xl text-sm italic text-muted-foreground">{payload.description}</p>
          )}
        </div>
      </header>

      {/* Hero Image */}
      {hero && (
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <PhotoTile
            img={hero}
            index={0}
            onClick={() => onImageClick(0)}
            aspect="landscape"
            className="w-full rounded-xl shadow-lg"
          />
        </div>
      )}

      {/* Gallery */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {rest.map((img, idx) => (
            <PhotoTile key={img.id} img={img} index={idx + 1} onClick={() => onImageClick(idx + 1)} />
          ))}
        </div>
      </main>
    </div>
  )
}

// Lavender Dream - Purple theme
function LavenderDream({ payload, onImageClick }: GalleryLayoutProps) {
  const [hero, ...rest] = payload.images

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/90 via-white to-fuchsia-50/70">
      {/* Header Card */}
      <header className="px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-4xl rounded-2xl border border-violet-200/80 bg-white px-6 py-8 text-center shadow-md sm:px-12 sm:py-10">
          <h1 className="text-2xl font-semibold text-violet-950 sm:text-3xl md:text-4xl">
            {payload.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-violet-800/85">
            {payload.eventType && <span className="capitalize">{payload.eventType}</span>}
            {payload.location && <span>· {payload.location}</span>}
            {formatRange(payload.startsAt, payload.endsAt) && <span>· {formatRange(payload.startsAt, payload.endsAt)}</span>}
          </div>
          {payload.description && (
            <p className="mx-auto mt-4 max-w-xl text-sm text-violet-700/80">{payload.description}</p>
          )}
        </div>
      </header>

      {/* Gallery with featured hero */}
      <main className="mx-auto max-w-6xl px-4 pb-8 sm:px-8 sm:pb-12">
        {hero && (
          <div className="mb-6 sm:mb-8">
            <PhotoTile
              img={hero}
              index={0}
              onClick={() => onImageClick(0)}
              aspect="landscape"
              className="w-full rounded-xl shadow-md"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {rest.map((img, idx) => (
            <PhotoTile key={img.id} img={img} index={idx + 1} onClick={() => onImageClick(idx + 1)} />
          ))}
        </div>
      </main>
    </div>
  )
}

// Sports Bold - energetic light palette
function SportsBold({ payload, onImageClick }: GalleryLayoutProps) {
  const [hero, ...rest] = payload.images

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/90 via-white to-slate-50 text-slate-900">
      {/* Bold Header */}
      <header className="border-b border-amber-200/80 bg-gradient-to-r from-amber-100 via-orange-50 to-amber-50 px-4 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900/70">
            {payload.eventType && (
              <span className="rounded-md border border-amber-300/80 bg-white/80 px-2 py-1 text-amber-950 shadow-sm">
                {payload.eventType}
              </span>
            )}
            <span className="hidden sm:inline text-amber-800/50">·</span>
            {formatRange(payload.startsAt, payload.endsAt) && (
              <span className="text-amber-900/80">{formatRange(payload.startsAt, payload.endsAt)}</span>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-amber-950 sm:text-4xl md:text-5xl">{payload.title}</h1>
          {payload.location && (
            <p className="mt-2 flex items-center gap-1 text-sm font-medium text-amber-900/75">
              <MapPin className="h-4 w-4" /> {payload.location}
            </p>
          )}
        </div>
      </header>

      {/* Gallery */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        {/* Featured hero */}
        {hero && (
          <div className="mb-4 sm:mb-6">
            <PhotoTile
              img={hero}
              index={0}
              onClick={() => onImageClick(0)}
              aspect="landscape"
              className="w-full rounded-lg"
            />
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 md:gap-3">
          {rest.map((img, idx) => (
            <PhotoTile
              key={img.id}
              img={img}
              index={idx + 1}
              onClick={() => onImageClick(idx + 1)}
              className="rounded-md"
            />
          ))}
        </div>
      </main>

      {/* Footer accent */}
      <div className="h-1.5 bg-gradient-to-r from-amber-300 via-orange-200 to-amber-200" />
    </div>
  )
}

// Obsidian frame — clean light gallery (minimal borders, bright canvas)
function MinimalDark({ payload, onImageClick }: GalleryLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-zinc-800">
      {/* Minimal Header */}
      <header className="border-b border-zinc-200 bg-zinc-50/90 px-4 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-light tracking-wide text-zinc-900 sm:text-3xl">{payload.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600">
            {payload.eventType && <span>{payload.eventType}</span>}
            {payload.location && <span>· {payload.location}</span>}
            {formatRange(payload.startsAt, payload.endsAt) && <span>· {formatRange(payload.startsAt, payload.endsAt)}</span>}
          </div>
        </div>
      </header>

      {/* Gallery */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {payload.images.map((img, idx) => {
            const isVideo = isVideoContentType(img.contentType)
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => onImageClick(idx)}
                aria-label={isVideo ? `Play video ${idx + 1}` : `View image ${idx + 1}`}
                className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-50 transition-all duration-300 hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-300/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/25 group-hover:opacity-100">
                  <div className="rounded-full bg-white/90 p-2.5 text-zinc-900 shadow-md">
                    {isVideo ? (
                      <Play className="h-5 w-5 fill-current" aria-hidden />
                    ) : (
                      <ZoomIn className="h-5 w-5" strokeWidth={2} aria-hidden />
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}

// Album Meta Component
function AlbumMeta({
  payload,
  className,
}: {
  payload: PublicAlbumPayload
  className?: string
}) {
  const range = formatRange(payload.startsAt, payload.endsAt)

  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground", className)}>
      {payload.description && <p className="w-full text-foreground/80">{payload.description}</p>}
      {payload.eventType && <span className="capitalize">{payload.eventType}</span>}
      {payload.location && (
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" /> {payload.location}
        </span>
      )}
      {range && (
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> {range}
        </span>
      )}
    </div>
  )
}

interface PublicGalleryViewProps {
  payload: PublicAlbumPayload
  /** Public URL token segment; used for PIN unlock and view analytics. */
  publicToken?: string
}

export function PublicGalleryView({ payload, publicToken }: PublicGalleryViewProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!publicToken || payload.locked || payload.expired || !payload.storageConfigured) return
    const key = `cg_view_${publicToken}`
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return
    } catch {
      /* ignore */
    }
    void fetch(`/api/client-gallery/public/${encodeURIComponent(publicToken)}/view`, { method: "POST" }).finally(() => {
      try {
        sessionStorage.setItem(key, "1")
      } catch {
        /* ignore */
      }
    })
  }, [publicToken, payload.locked, payload.expired, payload.storageConfigured])

  const handleImageClick = (index: number) => {
    setLightboxIndex(index)
  }

  const handleCloseLightbox = () => {
    setLightboxIndex(null)
  }

  const handleNavigate = (index: number) => {
    setLightboxIndex(index)
  }

  if (payload.locked && publicToken) {
    return <PublicGalleryPinGate publicToken={publicToken} albumTitle={payload.title} />
  }

  if (payload.locked && !publicToken) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-foreground">{payload.title}</h1>
        <p className="mt-4 text-muted-foreground">This gallery is protected.</p>
      </div>
    )
  }

  // Error states
  if (!payload.storageConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-foreground">{payload.title}</h1>
        <p className="mt-4 text-muted-foreground">
          This gallery cannot load photos yet — the owner needs to connect S3-compatible storage.
        </p>
      </div>
    )
  }

  if (payload.expired) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-foreground">{payload.title}</h1>
        <p className="mt-4 text-muted-foreground">
          This gallery link has expired. Contact the host if you need access.
        </p>
      </div>
    )
  }

  if (payload.images.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-foreground">{payload.title}</h1>
        <AlbumMeta payload={payload} className="mt-4 justify-center" />
        <p className="mt-4 text-muted-foreground">No photos uploaded yet.</p>
      </div>
    )
  }

  const templateId = payload.galleryTemplateId || DEFAULT_GALLERY_TEMPLATE_ID

  const layoutProps: GalleryLayoutProps = {
    payload,
    onImageClick: handleImageClick,
  }

  return (
    <>
      {/* Template Switch */}
      {templateId === "cinematic-hero" && <HeroRibbon {...layoutProps} />}
      {templateId === "storyflow" && <MasonryFlow {...layoutProps} />}
      {templateId === "artisan-bento" && <BentoModern {...layoutProps} />}
      {templateId === "blush-serenity" && <WeddingSoft {...layoutProps} />}
      {templateId === "amethyst-garden" && <LavenderDream {...layoutProps} />}
      {templateId === "velocity-edge" && <SportsBold {...layoutProps} />}
      {templateId === "obsidian-frame" && <MinimalDark {...layoutProps} />}
      {(templateId === "midnight-elegance" || !templateId) && <ClassicGrid {...layoutProps} />}

      {/* Lightbox */}
      <GalleryLightbox
        images={payload.images}
        currentIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={handleCloseLightbox}
        onNavigate={handleNavigate}
        albumTitle={payload.title}
      />
    </>
  )
}
