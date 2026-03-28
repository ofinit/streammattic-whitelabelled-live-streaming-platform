import type { Metadata } from "next"
import { headers } from "next/headers"
import {
  type WatchEventMetaPayload,
  buildWatchDisplayName,
  buildWatchDocumentTitle,
  buildWatchShareDescription,
  formatWatchScheduleForMeta,
  resolveWatchOgImageUrl,
} from "@/lib/watch-event-metadata-helpers"

export type BuildWatchMetadataOptions = {
  /** e.g. `/watch/abc` or `/my-event-slug` for og:url + canonical */
  canonicalPath: string
}

async function resolveMetadataRequestBase(): Promise<string> {
  try {
    const h = await headers()
    const host =
      h.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      h.get("host")?.trim()
    if (host) {
      const proto =
        h.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
        (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")
      return `${proto}://${host}`.replace(/\/$/, "")
    }
  } catch {
    /* outside request context */
  }
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")
}

/** Server-side fetch for watch / slug event pages (title, OG, favicon from API). */
export async function buildWatchEventMetadata(
  eventIdOrSlug: string,
  options?: BuildWatchMetadataOptions,
): Promise<Metadata> {
  const base = await resolveMetadataRequestBase()
  const rawPath =
    options?.canonicalPath ??
    `/${eventIdOrSlug.split("/").filter(Boolean).join("/") || eventIdOrSlug}`
  const canonicalPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`
  const canonicalUrl = `${base}${canonicalPath}`

  try {
    const res = await fetch(`${base}/api/watch/${encodeURIComponent(eventIdOrSlug)}`, { cache: "no-store" })
    if (!res.ok) return { title: "Event" }
    const data = await res.json()
    const event = data.event as WatchEventMetaPayload & { faviconHref?: string } | undefined
    if (!event) return { title: "Event" }

    const scheduleLine = formatWatchScheduleForMeta(event)
    const title = buildWatchDocumentTitle(event)
    const description = buildWatchShareDescription(event, scheduleLine)
    const ogImageUrl = resolveWatchOgImageUrl(base, event)
    const iconHref = event.faviconHref

    const publishedTime =
      event.scheduledAt && !Number.isNaN(new Date(event.scheduledAt).getTime())
        ? new Date(event.scheduledAt).toISOString()
        : undefined

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      ...(iconHref && {
        icons: {
          icon: [
            {
              url: iconHref,
              ...(iconHref.endsWith(".svg") ? { type: "image/svg+xml" as const } : {}),
            },
          ],
        },
      }),
      openGraph: {
        type: "website",
        url: canonicalUrl,
        siteName: "StreamLivee",
        title,
        description,
        locale: "en_US",
        ...(publishedTime && { publishedTime }),
        ...(ogImageUrl && {
          images: [
            {
              url: ogImageUrl,
              alt: `${buildWatchDisplayName(event)} — event`,
            },
          ],
        }),
      },
      twitter: {
        card: "summary_large_image" as const,
        title,
        description,
        ...(ogImageUrl && { images: [ogImageUrl] }),
      },
    }
  } catch {
    return { title: "Event" }
  }
}
