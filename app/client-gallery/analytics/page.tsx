"use client"

import Link from "next/link"
import useSWR from "swr"
import { BarChart3, ExternalLink, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CLIENT_GALLERY_BASE } from "@/lib/client-gallery-nav-items"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
  assetCount?: number
  guestViewCount?: number
  lastGuestViewAt?: string | null
}

export default function ClientGalleryAnalyticsPage() {
  const { data, error, isLoading } = useSWR<{ albums: AlbumRow[] }>("/api/client-gallery/albums", fetcher)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading analytics…
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-6 text-sm text-destructive">
          Could not load analytics. You may need to sign in or enable the photo gallery add-on.
        </CardContent>
      </Card>
    )
  }

  const albums = Array.isArray(data?.albums) ? data.albums : []
  const totalViews = albums.reduce((s, a) => s + (typeof a.guestViewCount === "number" ? a.guestViewCount : 0), 0)

  return (
    <div className="space-y-8 py-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Guest page views are counted once per browser session when someone opens your public gallery link. No personal
          data is collected.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Album views</CardTitle>
            <CardDescription>
              Total counted guest sessions: <strong className="text-foreground">{totalViews}</strong>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {albums.length === 0 ? (
            <p className="text-sm text-muted-foreground">No albums yet. Create one under New album.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Album</TableHead>
                  <TableHead className="text-right">Photos</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead>Last viewed</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {albums.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title || "Untitled"}</TableCell>
                    <TableCell className="text-right tabular-nums">{a.assetCount ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{a.guestViewCount ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.lastGuestViewAt ? new Date(a.lastGuestViewAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`${CLIENT_GALLERY_BASE}/album/${a.id}`}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        Manage
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
