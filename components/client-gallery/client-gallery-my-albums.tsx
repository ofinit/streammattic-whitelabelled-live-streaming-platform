"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ExternalLink, ImageIcon, LayoutGrid, List, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CLIENT_GALLERY_BASE } from "@/lib/client-gallery-nav-items"
import { getGalleryTemplateById } from "@/lib/client-gallery-templates"

const VIEW_STORAGE_KEY = "client-gallery-my-albums-view"

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
  galleryTemplateId?: string
}

export function ClientGalleryMyAlbums() {
  const { data, error, isLoading, mutate } = useSWR("/api/client-gallery/albums", fetcher, {
    revalidateOnFocus: true,
  })

  const albums = useMemo(() => (Array.isArray(data?.albums) ? (data.albums as AlbumRow[]) : []), [data])
  const [deleteTarget, setDeleteTarget] = useState<AlbumRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [view, setView] = useState<"grid" | "list">("grid")

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_STORAGE_KEY)
      if (v === "list" || v === "grid") setView(v)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view)
    } catch {
      /* ignore */
    }
  }, [view])

  async function confirmDeleteAlbum() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/client-gallery/albums/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const out = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((out as { error?: string }).error || "Could not delete album")
      }
      toast.success("Album deleted")
      setDeleteTarget(null)
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">My albums</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Standalone photographer albums stored in your S3-compatible bucket. Share links are public for guests; no tie-in
          to live events or watch pages.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild>
          <Link href={`${CLIENT_GALLERY_BASE}/new-album`}>
            <Plus className="mr-2 h-4 w-4" />
            New album
          </Link>
        </Button>
        <div
          className="inline-flex rounded-lg border border-border p-0.5"
          role="group"
          aria-label="Album layout"
        >
          <Button
            type="button"
            variant={view === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="gap-1.5 px-3"
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Grid</span>
          </Button>
          <Button
            type="button"
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="gap-1.5 px-3"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </Button>
        </div>
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

      {!isLoading && !error && albums.length > 0 && view === "grid" && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((al) => {
            const count = typeof al.assetCount === "number" ? al.assetCount : 0
            const guestHref = `/client-gallery/v/${al.publicToken}`
            const designName = al.galleryTemplateId
              ? getGalleryTemplateById(al.galleryTemplateId)?.name ?? al.galleryTemplateId
              : null
            return (
              <li key={al.id}>
                <Card className="h-full overflow-hidden border-border transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-muted">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/60" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-medium text-foreground">{al.title || "Untitled album"}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {count === 0 ? "No photos yet" : `${count} photo${count === 1 ? "" : "s"}`}
                      </p>
                      {designName ? (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{designName}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={guestHref} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1 h-4 w-4" />
                          Guest view
                        </a>
                      </Button>
                      <Button variant="default" size="sm" className="flex-1" asChild>
                        <Link href={`${CLIENT_GALLERY_BASE}/album/${al.id}`}>Manage</Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteTarget(al)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      {!isLoading && !error && albums.length > 0 && view === "list" && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {albums.map((al) => {
            const count = typeof al.assetCount === "number" ? al.assetCount : 0
            const guestHref = `/client-gallery/v/${al.publicToken}`
            const designName = al.galleryTemplateId
              ? getGalleryTemplateById(al.galleryTemplateId)?.name ?? al.galleryTemplateId
              : null
            return (
              <li key={al.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-medium text-foreground">{al.title || "Untitled album"}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {count === 0 ? "No photos" : `${count} photo${count === 1 ? "" : "s"}`}
                    {designName ? ` · ${designName}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" asChild>
                    <a href={guestHref} target="_blank" rel="noopener noreferrer" title="Guest view">
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">Guest view</span>
                    </a>
                  </Button>
                  <Button variant="default" size="sm" className="h-8" asChild>
                    <Link href={`${CLIENT_GALLERY_BASE}/album/${al.id}`}>Manage</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-destructive hover:text-destructive"
                    aria-label={`Delete album ${al.title || "Untitled"}`}
                    onClick={() => setDeleteTarget(al)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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

      <AlertDialog open={deleteTarget != null} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this album?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the album from the app and deletes all photos under its folder in your S3-compatible bucket.
              {deleteTarget ? (
                <>
                  {" "}
                  <span className="font-medium text-foreground">“{deleteTarget.title || "Untitled"}”</span> cannot be
                  recovered.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={deleting} onClick={() => void confirmDeleteAlbum()}>
              {deleting ? "Deleting…" : "Delete album"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
