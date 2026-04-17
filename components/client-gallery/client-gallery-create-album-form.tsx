"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FolderPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { CLIENT_GALLERY_BASE } from "@/lib/client-gallery-nav-items"

export function ClientGalleryCreateAlbumForm() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [creating, setCreating] = useState(false)

  async function createAlbum() {
    setCreating(true)
    try {
      const res = await fetch("/api/client-gallery/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: title.trim() || undefined }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; album?: { id: string } }
      if (!res.ok) {
        throw new Error(data.error || "Could not create album")
      }
      if (!data.album?.id) {
        throw new Error("Invalid response")
      }
      toast.success("Album created")
      router.push(`/client-gallery/album/${data.album.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create album")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-8 py-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New album</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Create a standalone album in your S3-compatible bucket. After creation you can upload photos, copy the guest
          link, and print a QR code — independent of live events and the Control Center.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Album details</CardTitle>
          <CardDescription>Choose a title. You can upload and share on the next screen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="album-title">Title</Label>
            <Input
              id="album-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Reception — Dec 2025"
              className="max-w-md"
            />
          </div>
          <Button type="button" onClick={() => void createAlbum()} disabled={creating} className="gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
            Create and continue
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href={`${CLIENT_GALLERY_BASE}/my-albums`}>My albums</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href={CLIENT_GALLERY_BASE}>Back to gallery dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
