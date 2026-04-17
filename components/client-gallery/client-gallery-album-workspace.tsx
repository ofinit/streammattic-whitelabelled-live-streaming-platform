"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import QRCode from "react-qr-code"
import useSWR from "swr"
import { Copy, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CLIENT_GALLERY_BASE } from "@/lib/client-gallery-nav-items"

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: "include" })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText || "Request failed")
  }
  return data
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText || "Request failed")
  }
  return data as T
}

export function ClientGalleryAlbumWorkspace({ albumId }: { albumId: string }) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/client-gallery/albums/${albumId}`,
    fetcher,
    { revalidateOnFocus: true },
  )

  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)

  const album = data?.album as
    | {
        title?: string
        viewerUrl?: string
        viewerPath?: string
        storageConfigured?: boolean
        assets?: { id: string; url: string | null; contentType?: string | null }[]
      }
    | undefined

  const uploadFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return
      setUploading(true)
      try {
        const list = Array.from(files)
        for (const file of list) {
          const up = await fetchJson<{
            presignedUrl: string
            key: string
            headers: { "Content-Type": string }
          }>(`/api/client-gallery/albums/${albumId}/upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type || "application/octet-stream",
              byteSize: file.size,
            }),
          })

          const putRes = await fetch(up.presignedUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": up.headers["Content-Type"] || file.type || "application/octet-stream",
            },
          })
          if (!putRes.ok) {
            throw new Error(`Upload failed for ${file.name}`)
          }

          await fetchJson(`/api/client-gallery/albums/${albumId}/assets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: up.key,
              contentType: file.type || null,
              byteSize: file.size,
            }),
          })
        }
        toast.success(list.length === 1 ? "Photo uploaded" : `${list.length} photos uploaded`)
        await mutate()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed")
      } finally {
        setUploading(false)
      }
    },
    [albumId, mutate],
  )

  const copyLink = useCallback(async () => {
    const text =
      album?.viewerUrl ||
      (typeof window !== "undefined" && album?.viewerPath
        ? `${window.location.origin}${album.viewerPath}`
        : "")
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Link copied")
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy")
    }
  }, [album?.viewerPath, album?.viewerUrl])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading album…
      </div>
    )
  }

  if (error || !album) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-6 text-sm text-destructive">
          Could not load this album. It may have been removed or you may not have access.
        </CardContent>
      </Card>
    )
  }

  const qrValue =
    (album.viewerUrl && album.viewerUrl.length > 0
      ? album.viewerUrl
      : typeof window !== "undefined" && album.viewerPath
        ? `${window.location.origin}${album.viewerPath}`
        : "") || " "

  const assets = Array.isArray(album.assets) ? album.assets : []

  return (
    <div className="space-y-8 py-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{album.title || "Album"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Guest link and QR open a public page — separate from live events and Control Center.
        </p>
      </div>

      {!album.storageConfigured ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-4 text-sm text-foreground">
            Object storage is not configured on the server. Set <code className="rounded bg-muted px-1">CLIENT_GALLERY_S3_*</code>{" "}
            environment variables, then uploads will work.
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Share with guests</CardTitle>
          <CardDescription>Anyone with this link can view photos (no login).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-white p-4 shadow-sm">
            <QRCode value={qrValue} size={180} level="M" />
            <span className="text-center text-xs text-neutral-600">Scan to open</span>
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="gap-2" onClick={() => void copyLink()}>
                <Copy className="h-4 w-4" />
                {copied ? "Copied" : "Copy link"}
              </Button>
              {album.viewerPath ? (
                <Button type="button" variant="outline" className="gap-2" asChild>
                  <a href={album.viewerPath} target="_blank" rel="noopener noreferrer">
                    Open guest view
                  </a>
                </Button>
              ) : null}
            </div>
            <Input readOnly value={album.viewerUrl || album.viewerPath || ""} className="font-mono text-xs" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Upload photos</CardTitle>
          <CardDescription>Images go to your bucket via signed URLs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-10 transition-colors hover:bg-muted/50">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {uploading ? "Uploading…" : "Drop images here or click to browse"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={uploading || !album.storageConfigured}
              onChange={(e) => void uploadFiles(e.target.files)}
            />
          </label>
          {uploading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </div>
          ) : null}
        </CardContent>
      </Card>

      {assets.length > 0 ? (
        <div>
          <h2 className="mb-3 text-lg font-medium text-foreground">Photos</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {assets.map((a) => (
              <li key={a.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
                {a.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No preview</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href={`${CLIENT_GALLERY_BASE}/my-albums`}>My albums</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href={CLIENT_GALLERY_BASE}>Gallery dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
