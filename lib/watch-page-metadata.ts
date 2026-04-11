import type { Metadata } from "next"
import { headers } from "next/headers"
import {
  type WatchEventMetaPayload,
  buildWatchDisplayName,
  buildWatchDocumentTitle,
  buildWatchShareDescription,
  formatWatchScheduleForMeta,
  resolveWatchOgImageUrl,
  toAbsolutePublicAssetUrl,
} from "@/lib/watch-event-metadata-helpers"
import { DEFAULT_EVENT_SUSPENDED_PUBLIC_MESSAGE } from "@/lib/event-suspended"

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
    const data = (await res.json()) as {
      event?: WatchEventMetaPayload & { faviconHref?: string }
      favicon?: string
    }
    const event = data.event
    if (!event) return { title: "Event" }

    const suspended = (event as { isSuspended?: boolean }).isSuspended === true

    const faviconRaw =
      (typeof data.favicon === "string" && data.favicon.trim()) ||
      (typeof event.faviconHref === "string" && event.faviconHref.trim()) ||
      ""

    const scheduleLine = formatWatchScheduleForMeta(event)
    const title = suspended ? "Event unavailable" : buildWatchDocumentTitle(event)
    const description = suspended ? DEFAULT_EVENT_SUSPENDED_PUBLIC_MESSAGE : buildWatchShareDescription(event, scheduleLine)
    const ogImageUrl = resolveWatchOgImageUrl(base, event, faviconRaw || null)
    const iconHref = faviconRaw ? toAbsolutePublicAssetUrl(base, faviconRaw) : undefined

    const publishedTime =
      !suspended &&
      event.scheduledAt &&
      !Number.isNaN(new Date(event.scheduledAt).getTime())
        ? new Date(event.scheduledAt).toISOString()
        : undefined

    return {
      title,
      description,
      ...(suspended ? { robots: { index: false, follow: false } } : {}),
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
        images: [
          {
            url: ogImageUrl,
            alt: `${buildWatchDisplayName(event)} — event`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image" as const,
        title,
        description,
        images: [ogImageUrl],
      },
    }
  } catch {
    return { title: "Event" }
  }
}
