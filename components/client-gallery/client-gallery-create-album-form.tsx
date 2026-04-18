"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, FolderPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  CLIENT_GALLERY_TEMPLATES,
  DEFAULT_GALLERY_TEMPLATE_ID,
  type GalleryTemplateCategory,
} from "@/lib/client-gallery-templates"
import { CLIENT_GALLERY_BASE } from "@/lib/client-gallery-nav-items"

const EVENT_TYPES = ["Wedding", "Corporate", "Sports", "Party", "Other"] as const

const CATEGORY_LABEL: Record<GalleryTemplateCategory, string> = {
  wedding: "Wedding",
  events: "Events",
  sports: "Sports",
  custom: "Custom",
}

const CATEGORY_ORDER: GalleryTemplateCategory[] = ["wedding", "events", "sports", "custom"]

function dateInputToIso(dateStr: string): string | null {
  const t = dateStr.trim()
  if (!t) return null
  const d = new Date(`${t}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export function ClientGalleryCreateAlbumForm() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [creating, setCreating] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [eventType, setEventType] = useState<string>("")
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [notes, setNotes] = useState("")
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const [category, setCategory] = useState<GalleryTemplateCategory>("events")
  const [galleryTemplateId, setGalleryTemplateId] = useState(DEFAULT_GALLERY_TEMPLATE_ID)

  const filteredTemplates = useMemo(
    () => CLIENT_GALLERY_TEMPLATES.filter((t) => t.category === category),
    [category],
  )

  function goNext() {
    const t = title.trim()
    if (t.length === 0) {
      toast.error("Enter an album or event name to continue.")
      return
    }
    setStep(2)
  }

  async function createAlbum() {
    setCreating(true)
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        galleryTemplateId,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        eventType: eventType || undefined,
        startsAt: dateInputToIso(startsAt),
        endsAt: dateInputToIso(endsAt),
        expiresAt: dateInputToIso(expiresAt),
        notes: notes.trim() || undefined,
      }
      const res = await fetch("/api/client-gallery/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
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
          Set up your album details, pick a guest-facing layout, then upload photos on the next screen. Storage uses your
          S3-compatible bucket from Client gallery → Settings.
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span
          className={cn(
            "rounded-full px-3 py-1 font-medium",
            step === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          1. Details
        </span>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        <span
          className={cn(
            "rounded-full px-3 py-1 font-medium",
            step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          2. Design
        </span>
      </div>

      {step === 1 ? (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Album details</CardTitle>
            <CardDescription>Name your album and add optional context for guests.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="album-title">
                Album / event name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="album-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reception — Dec 2025"
                className="max-w-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="album-description">Description</Label>
              <Textarea
                id="album-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional — shown on the public guest page for some layouts."
                rows={3}
                className="max-w-xl resize-y"
              />
            </div>
            <div className="grid max-w-xl gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="album-start">Start date</Label>
                <Input id="album-start" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="album-end">End date</Label>
                <Input id="album-end" type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </div>
            </div>
            <div className="grid max-w-xl gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="album-type">Event type</Label>
                <select
                  id="album-type"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
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
                <Label htmlFor="album-location">Location</Label>
                <Input
                  id="album-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Venue or city (optional)"
                />
              </div>
            </div>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="px-0 text-muted-foreground hover:text-foreground">
                  Advanced {advancedOpen ? "▾" : "▸"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="album-expires">Guest link expiry</Label>
                  <Input
                    id="album-expires"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">After this date, guests only see an expiry message.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="album-notes">Organizer notes</Label>
                  <Textarea
                    id="album-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Private notes — shown to you on the manage page only."
                    rows={3}
                    className="max-w-xl resize-y"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" onClick={() => goNext()}>
                Next: Select design
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Select design</CardTitle>
            <CardDescription>Choose how the public guest gallery looks. You can change branding later in manage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b border-border pb-3">
              {CATEGORY_ORDER.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={category === cat ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setCategory(cat)
                    const first = CLIENT_GALLERY_TEMPLATES.find((t) => t.category === cat)
                    if (first) setGalleryTemplateId(first.id)
                  }}
                >
                  {CATEGORY_LABEL[cat]}
                </Button>
              ))}
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((t) => {
                const selected = galleryTemplateId === t.id
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setGalleryTemplateId(t.id)}
                      className={cn(
                        "w-full rounded-xl border-2 p-4 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      <div
                        className={cn(
                          "mb-3 aspect-video rounded-lg bg-gradient-to-br",
                          t.id === "wedding-soft" && "from-rose-100 to-rose-50 dark:from-rose-950/50 dark:to-rose-900/20",
                          t.id === "lavender-dream" && "from-violet-200 to-violet-50 dark:from-violet-950 dark:to-violet-900/30",
                          t.id === "sports-bold" && "from-zinc-700 to-zinc-900",
                          t.id === "minimal-dark" && "from-zinc-800 to-black",
                          t.id === "hero-ribbon" && "from-primary/30 to-muted",
                          t.id === "masonry-flow" && "from-amber-100/80 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20",
                          t.id === "bento-modern" && "from-sky-100 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/30",
                          t.id === "classic-grid" && "from-muted to-background",
                        )}
                      />
                      <p className="font-medium text-foreground">{t.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={creating}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Button type="button" onClick={() => void createAlbum()} disabled={creating} className="gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
                Create album
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
