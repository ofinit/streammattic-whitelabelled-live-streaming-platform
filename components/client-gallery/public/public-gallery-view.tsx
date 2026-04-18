import { cn } from "@/lib/utils"
import type { PublicAlbumPayload } from "@/lib/client-gallery-album-service"
import { DEFAULT_GALLERY_TEMPLATE_ID } from "@/lib/client-gallery-templates"

function formatRange(startsAt: string | null, endsAt: string | null): string | null {
  const a = startsAt ? new Date(startsAt) : null
  const b = endsAt ? new Date(endsAt) : null
  if (a && !Number.isNaN(a.getTime()) && b && !Number.isNaN(b.getTime())) {
    return `${a.toLocaleDateString(undefined, { dateStyle: "medium" })} – ${b.toLocaleDateString(undefined, { dateStyle: "medium" })}`
  }
  if (a && !Number.isNaN(a.getTime())) return a.toLocaleDateString(undefined, { dateStyle: "medium" })
  return null
}

function PhotoTile({
  img,
}: {
  img: { id: string; url: string; contentType: string | null }
}) {
  return (
    <li className="aspect-square overflow-hidden rounded-lg bg-muted">
      <a
        href={img.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- presigned S3 URLs */}
        <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
      </a>
    </li>
  )
}

function AlbumMeta({
  payload,
  className,
}: {
  payload: PublicAlbumPayload
  className?: string
}) {
  const range = formatRange(payload.startsAt, payload.endsAt)
  return (
    <div className={cn("space-y-1 text-sm text-muted-foreground", className)}>
      {payload.description ? <p className="text-foreground/90">{payload.description}</p> : null}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {payload.location ? <span>{payload.location}</span> : null}
        {payload.eventType ? <span className="capitalize">{payload.eventType}</span> : null}
        {range ? <span>{range}</span> : null}
      </div>
    </div>
  )
}

function ClassicGrid({ payload }: { payload: PublicAlbumPayload }) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{payload.title}</h1>
      <AlbumMeta payload={payload} className="mt-4" />
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {payload.images.map((img) => (
          <PhotoTile key={img.id} img={img} />
        ))}
      </ul>
    </>
  )
}

function HeroRibbon({ payload }: { payload: PublicAlbumPayload }) {
  return (
    <>
      <div className="rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-muted px-6 py-8 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{payload.title}</h1>
        <AlbumMeta payload={payload} className="mt-3 justify-center text-center" />
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {payload.images.map((img) => (
          <PhotoTile key={img.id} img={img} />
        ))}
      </ul>
    </>
  )
}

function MasonryFlow({ payload }: { payload: PublicAlbumPayload }) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{payload.title}</h1>
      <AlbumMeta payload={payload} className="mt-4" />
      <ul className="mt-8 columns-2 gap-3 sm:columns-3 md:columns-4">
        {payload.images.map((img) => (
          <li key={img.id} className="mb-3 break-inside-avoid">
            <div className="overflow-hidden rounded-lg bg-muted">
              <a
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full object-cover" loading="lazy" />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

function BentoModern({ payload }: { payload: PublicAlbumPayload }) {
  const [first, second, ...rest] = payload.images
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{payload.title}</h1>
      <AlbumMeta payload={payload} className="mt-4" />
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
        {first ? (
          <div className="col-span-2 row-span-2 md:col-span-2 md:row-span-2">
            <div className="aspect-square overflow-hidden rounded-xl bg-muted md:aspect-auto md:h-full md:min-h-[280px]">
              <a
                href={first.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={first.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </a>
            </div>
          </div>
        ) : null}
        {second ? (
          <div className="col-span-1 md:col-span-1">
            <div className="aspect-square overflow-hidden rounded-xl bg-muted">
              <a
                href={second.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={second.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </a>
            </div>
          </div>
        ) : null}
        {rest.slice(0, 3).map((img) => (
          <div key={img.id} className="col-span-1">
            <div className="aspect-square overflow-hidden rounded-xl bg-muted">
              <a
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </a>
            </div>
          </div>
        ))}
      </div>
      {rest.length > 3 ? (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {rest.slice(3).map((img) => (
            <PhotoTile key={img.id} img={img} />
          ))}
        </ul>
      ) : null}
    </>
  )
}

function WeddingSoft({ payload }: { payload: PublicAlbumPayload }) {
  return (
    <>
      <div className="rounded-2xl bg-gradient-to-b from-rose-50/80 to-background px-6 py-10 text-center dark:from-rose-950/30 dark:to-background">
        <p className="text-xs font-medium uppercase tracking-widest text-rose-600/80 dark:text-rose-300/90">Gallery</p>
        <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{payload.title}</h1>
        <AlbumMeta payload={payload} className="mt-4 justify-center text-center" />
      </div>
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {payload.images.map((img) => (
          <PhotoTile key={img.id} img={img} />
        ))}
      </ul>
    </>
  )
}

function LavenderDream({ payload }: { payload: PublicAlbumPayload }) {
  return (
    <>
      <div className="rounded-2xl border border-violet-200/60 bg-violet-50/40 px-6 py-8 dark:border-violet-900/50 dark:bg-violet-950/20">
        <h1 className="text-center text-xl font-semibold text-violet-950 dark:text-violet-100">{payload.title}</h1>
        <AlbumMeta payload={payload} className="mt-3 text-center text-violet-900/80 dark:text-violet-200/80" />
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {payload.images.map((img) => (
          <PhotoTile key={img.id} img={img} />
        ))}
      </ul>
    </>
  )
}

function SportsBold({ payload }: { payload: PublicAlbumPayload }) {
  return (
    <>
      <div className="bg-zinc-900 px-6 py-8 text-center text-white">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{payload.title}</h1>
        <AlbumMeta payload={payload} className="mt-2 text-zinc-300" />
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 md:gap-3">
        {payload.images.map((img) => (
          <PhotoTile key={img.id} img={img} />
        ))}
      </ul>
    </>
  )
}

function MinimalDark({ payload }: { payload: PublicAlbumPayload }) {
  return (
    <div className="rounded-xl border border-border bg-zinc-950 px-4 py-8 sm:px-8">
      <h1 className="text-center text-xl font-medium text-zinc-100">{payload.title}</h1>
      <AlbumMeta payload={payload} className="mt-3 text-center text-zinc-400" />
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {payload.images.map((img) => (
          <li key={img.id} className="aspect-square overflow-hidden rounded-md bg-zinc-900">
            <a
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover opacity-95 hover:opacity-100" loading="lazy" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PublicGalleryView({ payload }: { payload: PublicAlbumPayload }) {
  if (!payload.storageConfigured) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{payload.title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          This gallery cannot load photos yet — the owner needs to connect S3-compatible storage under Client gallery →
          Settings.
        </p>
      </>
    )
  }

  if (payload.expired) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{payload.title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          This gallery link has expired. Contact the host if you need access.
        </p>
      </>
    )
  }

  if (payload.images.length === 0) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{payload.title}</h1>
        <AlbumMeta payload={payload} className="mt-4" />
        <p className="mt-4 text-sm text-muted-foreground">No photos uploaded yet.</p>
      </>
    )
  }

  const id = payload.galleryTemplateId || DEFAULT_GALLERY_TEMPLATE_ID

  switch (id) {
    case "hero-ribbon":
      return <HeroRibbon payload={payload} />
    case "masonry-flow":
      return <MasonryFlow payload={payload} />
    case "bento-modern":
      return <BentoModern payload={payload} />
    case "wedding-soft":
      return <WeddingSoft payload={payload} />
    case "lavender-dream":
      return <LavenderDream payload={payload} />
    case "sports-bold":
      return <SportsBold payload={payload} />
    case "minimal-dark":
      return <MinimalDark payload={payload} />
    case "classic-grid":
    default:
      return <ClassicGrid payload={payload} />
  }
}
