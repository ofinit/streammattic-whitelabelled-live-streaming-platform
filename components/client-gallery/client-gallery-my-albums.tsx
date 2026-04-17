"use client"

import { useMemo } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ExternalLink, ImageIcon, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CLIENT_GALLERY_BASE } from "@/lib/client-gallery-nav-items"

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: "include" })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText || "Request failed")
  }
  return data
}

type AlbumRow = {
  id: string
  title: string
  publicToken: string
  assetCount?: number
  updatedAt?: string
}

export function ClientGalleryMyAlbums() {
  const { data, error, isLoading } = useSWR(
    "/api/client-gallery/albums",
    fetcher,
    { revalidateOnFocus: true },
  )

  const albums = useMemo(() => (Array.isArray(data?.albums) ? (data.albums as AlbumRow[]) : []), [data])

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">My albums</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Standalone photographer albums stored in your S3-compatible bucket. Share links are public for guests; no tie-in
          to live events or watch pages.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`${CLIENT_GALLERY_BASE}/new-album`}>
            <Plus className="mr-2 h-4 w-4" />
            New album
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading albums…
        </div>
      )}

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-6 text-sm text-destructive">
            {(error as Error)?.message || "Could not load albums. Check add-on access or try again."}
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && albums.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <ImageIcon className="h-10 w-10 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">No albums yet</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Create an album, upload photos to your bucket, and share the guest link or QR code.
              </p>
            </div>
            <Button asChild>
              <Link href={`${CLIENT_GALLERY_BASE}/new-album`}>Create your first album</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && albums.length > 0 && (
        <ul className="space-y-3">
          {albums.map((al) => {
            const count = typeof al.assetCount === "number" ? al.assetCount : 0
            const guestHref = `/client-gallery/v/${al.publicToken}`
            return (
              <li key={al.id}>
                <Card className="overflow-hidden border-border transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-full shrink-0 items-center justify-center rounded-lg bg-muted sm:w-20">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/60" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-medium text-foreground">{al.title || "Untitled album"}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {count === 0 ? "No photos yet" : `${count} photo${count === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
                      <Button variant="outline" size="sm" asChild>
                        <a href={guestHref} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1 h-4 w-4" />
                          Guest view
                        </a>
                      </Button>
                      <Button variant="default" size="sm" asChild>
                        <Link href={`${CLIENT_GALLERY_BASE}/album/${al.id}`}>Manage</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="ghost" asChild>
          <Link href={CLIENT_GALLERY_BASE}>Back to gallery dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
