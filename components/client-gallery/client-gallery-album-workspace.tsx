"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import QRCode from "react-qr-code"
import useSWR from "swr"
import { Copy, Download, Loader2, RefreshCw, Trash2, Upload } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CLIENT_GALLERY_BASE } from "@/lib/client-gallery-nav-items"
import { DEFAULT_GALLERY_TEMPLATE_ID } from "@/lib/client-gallery-templates"
import { GalleryTemplatePicker } from "@/components/client-gallery/gallery-template-picker"
import {
  downloadAlbumQrPngPrint,
  downloadAlbumQrSvg,
} from "@/components/client-gallery/client-gallery-album-qr-download"
import { compressImageFileToWebp } from "@/lib/client-image-webp"
import { MAX_CLIENT_GALLERY_UPLOAD_BYTES } from "@/lib/client-gallery-utils"

const EVENT_TYPES = ["Wedding", "Corporate", "Sports", "Party", "Other"] as const

function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

function dateInputToIso(dateStr: string): string | null {
  const t = dateStr.trim()
  if (!t) return null
  const d = new Date(`${t}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

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
  const router = useRouter()
  const { data, error, isLoading, mutate } = useSWR(
    `/api/client-gallery/albums/${albumId}`,
    fetcher,
    { revalidateOnFocus: true },
  )

  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null)
  const [deletingAsset, setDeletingAsset] = useState(false)
  const [deleteAlbumOpen, setDeleteAlbumOpen] = useState(false)
  const [deletingAlbum, setDeletingAlbum] = useState(false)
  const [designTemplateId, setDesignTemplateId] = useState(DEFAULT_GALLERY_TEMPLATE_ID)
  const [savingDesign, setSavingDesign] = useState(false)
  const [savingDetails, setSavingDetails] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editLocation, setEditLocation] = useState("")
  const [editEventType, setEditEventType] = useState("")
  const [editStartsAt, setEditStartsAt] = useState("")
  const [editEndsAt, setEditEndsAt] = useState("")
  const [editExpiresAt, setEditExpiresAt] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [pinSaving, setPinSaving] = useState(false)
  const [copiedPin, setCopiedPin] = useState(false)
  const qrWrapRef = useRef<HTMLDivElement>(null)

  const serverTemplateId = (data?.album as { galleryTemplateId?: string } | undefined)?.galleryTemplateId
  useEffect(() => {
    setDesignTemplateId(serverTemplateId ?? DEFAULT_GALLERY_TEMPLATE_ID)
  }, [serverTemplateId])

  const album = data?.album as
    | {
        title?: string
        viewerUrl?: string
        viewerPath?: string
        storageConfigured?: boolean
        description?: string | null
        location?: string | null
        eventType?: string | null
        startsAt?: string | null
        endsAt?: string | null
        expiresAt?: string | null
        notes?: string | null
        galleryTemplateId?: string
        guestPinRequired?: boolean
        guestPin?: string | null
        assets?: { id: string; url: string | null; contentType?: string | null }[]
      }
    | undefined

  useEffect(() => {
    if (!album) return
    setEditTitle(album.title ?? "")
    setEditDescription(album.description ?? "")
    setEditLocation(album.location ?? "")
    setEditEventType(album.eventType ?? "")
    setEditStartsAt(isoToDateInput(album.startsAt))
    setEditEndsAt(isoToDateInput(album.endsAt))
    setEditExpiresAt(isoToDateInput(album.expiresAt))
    setEditNotes(album.notes ?? "")
  }, [album])

  const uploadFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return
      setUploading(true)
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"))
      if (list.length === 0) {
        toast.error("No image files selected")
        setUploading(false)
        return
      }
      if (list.length < files.length) {
        toast.message("Some files were skipped (images only)")
      }

      const toastId = toast.loading(`Preparing 0/${list.length}…`)
      const failures: string[] = []
      try {
        for (let i = 0; i < list.length; i++) {
          const file = list[i]
          toast.loading(`Preparing ${i + 1}/${list.length}…`, { id: toastId })

          await new Promise<void>((r) => {
            window.setTimeout(r, 0)
          })

          let out: File
          try {
            out = await compressImageFileToWebp(file, {
              maxEdge: 1920,
              quality: 0.82,
              strictWebp: true,
            })
          } catch (err) {
            failures.push(`${file.name}: ${err instanceof Error ? err.message : "Could not process"}`)
            continue
          }

          if (out.type !== "image/webp") {
            failures.push(`${file.name}: Expected WebP output`)
            continue
          }
          if (out.size > MAX_CLIENT_GALLERY_UPLOAD_BYTES) {
            failures.push(`${file.name}: Compressed file still too large`)
            continue
          }

          const up = await fetchJson<{
            presignedUrl: string
            key: string
            headers: { "Content-Type": string }
          }>(`/api/client-gallery/albums/${albumId}/upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: out.name,
              contentType: out.type,
              byteSize: out.size,
            }),
          })

          toast.loading(`Uploading ${i + 1}/${list.length}…`, { id: toastId })

          const putRes = await fetch(up.presignedUrl, {
            method: "PUT",
            body: out,
            headers: {
              "Content-Type": up.headers["Content-Type"] || out.type,
            },
          })
          if (!putRes.ok) {
            failures.push(`${file.name}: Upload failed`)
            continue
          }

          await fetchJson(`/api/client-gallery/albums/${albumId}/assets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: up.key,
              contentType: out.type,
              byteSize: out.size,
            }),
          })

          await new Promise<void>((r) => {
            window.setTimeout(r, 0)
          })
        }

        const ok = list.length - failures.length
        if (ok === list.length) {
          toast.success(list.length === 1 ? "Photo uploaded" : `${list.length} photos uploaded`, { id: toastId })
        } else if (ok > 0) {
          toast.warning(`Uploaded ${ok} of ${list.length}. Some files failed.`, { id: toastId })
          if (failures.length) {
            toast.error(failures.slice(0, 5).join("\n"), { duration: 8000 })
            if (failures.length > 5) {
              toast.message(`…and ${failures.length - 5} more`)
            }
          }
        } else {
          toast.error(failures[0] ?? "Upload failed", { id: toastId })
          if (failures.length > 1) {
            toast.error(failures.slice(1, 5).join("\n"), { duration: 8000 })
          }
        }

        if (ok > 0) await mutate()
      } catch (e) {
        toast.dismiss(toastId)
        toast.error(e instanceof Error ? e.message : "Upload failed")
      } finally {
        setUploading(false)
      }
    },
    [albumId, mutate],
  )

  const deleteAsset = useCallback(async () => {
    if (!deleteAssetId) return
    setDeletingAsset(true)
    try {
      const res = await fetch(`/api/client-gallery/albums/${albumId}/assets/${deleteAssetId}`, {
        method: "DELETE",
        credentials: "include",
      })
      const out = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((out as { error?: string }).error || "Could not delete photo")
      }
      toast.success("Photo deleted")
      setDeleteAssetId(null)
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeletingAsset(false)
    }
  }, [albumId, deleteAssetId, mutate])

  const deleteAlbum = useCallback(async () => {
    setDeletingAlbum(true)
    try {
      const res = await fetch(`/api/client-gallery/albums/${albumId}`, {
        method: "DELETE",
        credentials: "include",
      })
      const out = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((out as { error?: string }).error || "Could not delete album")
      }
      toast.success("Album deleted")
      setDeleteAlbumOpen(false)
      router.push(`${CLIENT_GALLERY_BASE}/my-albums`)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeletingAlbum(false)
    }
  }, [albumId, router])

  const saveGuestDesign = useCallback(async () => {
    setSavingDesign(true)
    try {
      await fetchJson<{ album?: { galleryTemplateId?: string } }>(`/api/client-gallery/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galleryTemplateId: designTemplateId }),
      })
      toast.success("Guest page design saved")
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save design")
    } finally {
      setSavingDesign(false)
    }
  }, [albumId, designTemplateId, mutate])

  const saveAlbumDetails = useCallback(async () => {
    const t = editTitle.trim()
    if (!t) {
      toast.error("Title is required")
      return
    }
    setSavingDetails(true)
    try {
      await fetchJson(`/api/client-gallery/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          description: editDescription.trim() || undefined,
          location: editLocation.trim() || undefined,
          eventType: editEventType || undefined,
          startsAt: dateInputToIso(editStartsAt),
          endsAt: dateInputToIso(editEndsAt),
          expiresAt: dateInputToIso(editExpiresAt),
          notes: editNotes.trim() || undefined,
        }),
      })
      toast.success("Album details saved")
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save details")
    } finally {
      setSavingDetails(false)
    }
  }, [
    albumId,
    editTitle,
    editDescription,
    editLocation,
    editEventType,
    editStartsAt,
    editEndsAt,
    editExpiresAt,
    editNotes,
    mutate,
  ])

  const setGuestPinRequired = useCallback(
    async (required: boolean) => {
      setPinSaving(true)
      try {
        await fetchJson(`/api/client-gallery/albums/${albumId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestPinRequired: required }),
        })
        toast.success(required ? "PIN enabled — share the code with guests" : "PIN disabled")
        await mutate()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update PIN settings")
      } finally {
        setPinSaving(false)
      }
    },
    [albumId, mutate],
  )

  const regenerateGuestPin = useCallback(async () => {
    setPinSaving(true)
    try {
      await fetchJson(`/api/client-gallery/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateGuestPin: true }),
      })
      toast.success("New PIN generated")
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not regenerate PIN")
    } finally {
      setPinSaving(false)
    }
  }, [albumId, mutate])

  const copyGuestPin = useCallback(async () => {
    const pin = album?.guestPin
    if (!pin) return
    try {
      await navigator.clipboard.writeText(pin)
      setCopiedPin(true)
      toast.success("PIN copied")
      window.setTimeout(() => setCopiedPin(false), 2000)
    } catch {
      toast.error("Could not copy")
    }
  }, [album?.guestPin])

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

  const downloadQrSvg = useCallback(() => {
    try {
      downloadAlbumQrSvg(qrWrapRef.current, "album-guest-qr")
      toast.success("QR downloaded (SVG)")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not download QR")
    }
  }, [])

  const downloadQrPngPrint = useCallback(async () => {
    try {
      await downloadAlbumQrPngPrint(qrWrapRef.current, { baseFilename: "album-guest-qr" })
      toast.success("QR downloaded (PNG, print)")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not export PNG")
    }
  }, [])

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

        <Collapsible open={editOpen} onOpenChange={setEditOpen} className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left text-lg font-semibold text-foreground hover:underline"
                >
                  Edit album details
                  <span className="text-sm font-normal text-muted-foreground">{editOpen ? "Hide" : "Show"}</span>
                </button>
              </CollapsibleTrigger>
              <CardDescription>Same fields as when you created the album — name, dates, guest link expiry, notes.</CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-4 border-t border-border pt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-album-title">
                    Album / event name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-album-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="max-w-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-album-description">Description</Label>
                  <Textarea
                    id="edit-album-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="max-w-xl resize-y"
                  />
                </div>
                <div className="grid max-w-xl gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-album-start">Start date</Label>
                    <Input
                      id="edit-album-start"
                      type="date"
                      value={editStartsAt}
                      onChange={(e) => setEditStartsAt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-album-end">End date</Label>
                    <Input id="edit-album-end" type="date" value={editEndsAt} onChange={(e) => setEditEndsAt(e.target.value)} />
                  </div>
                </div>
                <div className="grid max-w-xl gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-album-type">Event type</Label>
                    <select
                      id="edit-album-type"
                      value={editEventType}
                      onChange={(e) => setEditEventType(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select…</option>
                      {EVENT_TYPES.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-album-location">Location</Label>
                    <Input
                      id="edit-album-location"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-album-expires">Guest link expiry</Label>
                  <Input
                    id="edit-album-expires"
                    type="date"
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-album-notes">Organizer notes</Label>
                  <Textarea
                    id="edit-album-notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="max-w-xl resize-y"
                  />
                  <p className="text-xs text-muted-foreground">Private — not shown to guests.</p>
                </div>
                <Button type="button" disabled={savingDetails} onClick={() => void saveAlbumDetails()}>
                  {savingDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save details
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Share with guests</CardTitle>
          <CardDescription>
            Anyone with the link can open the gallery (no login). Turn on a PIN so guests must enter a code after
            opening the link.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div
            ref={qrWrapRef}
            className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-white p-4 shadow-sm"
          >
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
              <Button type="button" variant="outline" className="gap-2" onClick={downloadQrSvg}>
                <Download className="h-4 w-4" />
                Download QR (SVG)
              </Button>
              <Button type="button" variant="outline" className="gap-2" onClick={() => void downloadQrPngPrint()}>
                <Download className="h-4 w-4" />
                Download QR (PNG, print)
              </Button>
            </div>
            <Input readOnly value={album.viewerUrl || album.viewerPath || ""} className="font-mono text-xs" />
            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md">
                <Label htmlFor="guest-pin-display" className="text-foreground">
                  PIN
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="guest-pin-display"
                    readOnly
                    value={album.guestPinRequired && album.guestPin ? album.guestPin : "—"}
                    className="font-mono tracking-widest"
                    placeholder="Enable PIN to generate"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={!album.guestPinRequired || !album.guestPin || pinSaving}
                    title="Copy PIN"
                    onClick={() => void copyGuestPin()}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">{copiedPin ? "Copied" : "Copy PIN"}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={!album.guestPinRequired || pinSaving}
                    title="Generate new PIN"
                    onClick={() => void regenerateGuestPin()}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Regenerate PIN</span>
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:shrink-0">
                <Switch
                  id="guest-pin-do-not-ask"
                  checked={!album.guestPinRequired}
                  disabled={pinSaving}
                  onCheckedChange={(checked) => void setGuestPinRequired(!checked)}
                />
                <Label htmlFor="guest-pin-do-not-ask" className="cursor-pointer text-sm font-normal">
                  Do not ask PIN
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Guest page design</CardTitle>
          <CardDescription>
            How the public gallery looks for visitors (lightbox, slideshow, and layout). Open guest view to preview.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GalleryTemplatePicker
            value={designTemplateId}
            onChange={setDesignTemplateId}
            disabled={savingDesign}
            compact
          />
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              disabled={
                savingDesign ||
                designTemplateId === (album.galleryTemplateId ?? DEFAULT_GALLERY_TEMPLATE_ID)
              }
              onClick={() => void saveGuestDesign()}
            >
              {savingDesign ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save design
            </Button>
            {album.viewerPath ? (
              <Button type="button" variant="outline" asChild>
                <a href={album.viewerPath} target="_blank" rel="noopener noreferrer">
                  Preview guest page
                </a>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {!album.storageConfigured ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 py-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Connect your S3-compatible bucket (R2, Wasabi, AWS, etc.) under{" "}
              <strong className="text-foreground">Client gallery → Settings</strong> to enable uploads and guest image
              previews.
            </p>
            <Button type="button" variant="secondary" className="shrink-0" asChild>
              <Link href={`${CLIENT_GALLERY_BASE}/settings`}>Open Settings</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Upload photos</CardTitle>
          <CardDescription>
            Images are resized (max 1920px long edge), compressed to WebP in your browser, then sent to your bucket via
            signed URLs. Original files are not stored.
          </CardDescription>
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
              <li key={a.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                {a.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No preview</div>
                )}
                <div className="absolute right-1 top-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-background/90 text-destructive shadow-sm hover:bg-destructive/10"
                    title="Delete photo"
                    onClick={() => setDeleteAssetId(a.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Card className="border-destructive/30 bg-card">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Delete album</CardTitle>
          <CardDescription>
            Removes this album and deletes the album folder (and all objects inside it) in your S3-compatible bucket.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="destructive" onClick={() => setDeleteAlbumOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete entire album
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href={`${CLIENT_GALLERY_BASE}/my-albums`}>My albums</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href={CLIENT_GALLERY_BASE}>Gallery dashboard</Link>
        </Button>
      </div>

      <AlertDialog open={deleteAssetId != null} onOpenChange={(open) => !open && !deletingAsset && setDeleteAssetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the image from your album and deletes the file from your bucket. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAsset}>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={deletingAsset} onClick={() => void deleteAsset()}>
              {deletingAsset ? "Deleting…" : "Delete photo"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAlbumOpen} onOpenChange={(open) => !open && !deletingAlbum && setDeleteAlbumOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entire album?</AlertDialogTitle>
            <AlertDialogDescription>
              All photos will be removed from the app and deleted from your S3-compatible storage. Guest links will stop
              working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAlbum}>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={deletingAlbum} onClick={() => void deleteAlbum()}>
              {deletingAlbum ? "Deleting…" : "Delete album"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
