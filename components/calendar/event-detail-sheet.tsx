"use client"

import type React from "react"
import { format } from "date-fns"
import {
  BarChart3,
  Clock,
  ExternalLink,
  Eye,
  Globe,
  LinkIcon,
  MonitorPlay,
  Radio,
  ShieldCheck,
  User,
  Video,
  Youtube,
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { EVENT_TEMPLATES } from "@/lib/template-registry"
import { cn } from "@/lib/utils"
import { getEventPhotographerName } from "@/lib/event-photographer"
import type { CalendarEvent } from "./full-calendar"

const streamTypeDisplayNames: Record<string, string> = {
  pending: "Stream not configured",
  rtmp: "RTMP Server",
  youtube: "YouTube Live API",
  youtube_api: "YouTube Live API",
  youtube_embed: "YouTube Embed",
  hls: "HLS Stream",
  embedded: "Third Party Embed",
  third_party: "Third Party Embed",
}

const statusConfig: Record<string, { label: string; className: string }> = {
  live: { label: "Live", className: "bg-red-500 hover:bg-red-600 text-white" },
  on_break: { label: "On Break", className: "bg-orange-500 hover:bg-orange-600 text-white" },
  scheduled: { label: "Scheduled", className: "bg-blue-500 hover:bg-blue-600 text-white" },
  completed: { label: "Completed", className: "bg-emerald-500 hover:bg-emerald-600 text-white" },
  ended: { label: "Completed", className: "bg-emerald-500 hover:bg-emerald-600 text-white" },
  draft: { label: "Draft", className: "bg-yellow-500 hover:bg-yellow-600 text-white" },
  cancelled: { label: "Cancelled", className: "bg-muted-foreground hover:bg-muted-foreground/80 text-white" },
}

export function calendarStatusGroup(status: string): string {
  const normalized = status.toLowerCase()
  if (normalized === "ended") return "completed"
  if (normalized === "on_break") return "live"
  return normalized
}

export function CalendarStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status.toLowerCase()] || {
    label: status,
    className: "bg-primary text-white",
  }
  return <Badge className={config.className}>{config.label}</Badge>
}

function getStreamIcon(type: string) {
  switch (type.toLowerCase()) {
    case "rtmp":
      return <Video className="h-4 w-4" />
    case "youtube":
    case "youtube_api":
    case "youtube_embed":
      return <Youtube className="h-4 w-4" />
    case "hls":
      return <MonitorPlay className="h-4 w-4" />
    case "pending":
      return <Radio className="h-4 w-4" />
    default:
      return <Globe className="h-4 w-4" />
  }
}

function eventDate(event: CalendarEvent): Date {
  return new Date(event.scheduledAt || event.createdAt)
}

function formatDateTime(raw?: string | null, timezone?: string | null): string {
  if (!raw) return ""
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  const suffix = timezone && timezone !== "UTC" ? ` (${timezone})` : ""
  return `${format(date, "EEE, MMM d, yyyy 'at' h:mm a")}${suffix}`
}

function getTemplateName(event: CalendarEvent): string {
  const templateData = event.templateData
  const templateId =
    (typeof event.templateId === "string" && event.templateId) ||
    (templateData && typeof templateData === "object" && typeof templateData.templateId === "string"
      ? templateData.templateId
      : "")
  if (!templateId) return "Template default"
  return EVENT_TEMPLATES.find((template) => template.id === templateId)?.name || templateId
}

function getPublicUrl(event: CalendarEvent): string {
  if (event.publicUrl) return event.publicUrl
  const path = `/${event.slug || event.id}`
  if (event.studioCustomDomain) return `https://${event.studioCustomDomain}${path}`
  if (typeof window !== "undefined") return `${window.location.origin}${path}`
  return path
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="max-w-[12rem] truncate text-right text-sm font-medium text-foreground" title={String(value)}>
        {value}
      </span>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-semibold text-foreground">{value.toLocaleString()}</p>
    </div>
  )
}

export function EventDetailSheet({
  event,
  onClose,
  dashboardHref,
}: {
  event: CalendarEvent | null
  onClose: () => void
  dashboardHref: (event: CalendarEvent) => string
}) {
  const publicUrl = event ? getPublicUrl(event) : ""
  const photographerName = event ? getEventPhotographerName(event) : ""
  const streamType = event?.streamType || "pending"
  const streamLabel = streamTypeDisplayNames[streamType] || streamType

  return (
    <Sheet open={!!event} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-[420px] flex-col border-l border-border bg-card p-0 sm:max-w-[420px]">
        {event ? (
          <>
            <div className="border-b border-border bg-muted/30 p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <CalendarStatusBadge status={event.status} />
                <span className="rounded border border-border bg-background px-2 py-1 font-mono text-xs text-muted-foreground">
                  ID: {event.id.substring(0, 8)}
                </span>
              </div>
              <SheetTitle className="mb-2 pr-6 text-2xl font-bold leading-tight text-foreground">
                {event.title}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                {format(eventDate(event), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </SheetDescription>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto p-6">
              <section className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Stream Details</h4>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      streamType === "pending" ? "bg-yellow-500/15 text-yellow-600" : "bg-primary/10 text-primary",
                    )}
                  >
                    {getStreamIcon(streamType)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{streamLabel}</p>
                    <p className="text-xs text-muted-foreground">Stream Type</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Event Context</h4>
                <div className="rounded-lg border border-border bg-muted/10 px-3">
                  <DetailRow label="Owner" value={event.userName || event.studioName} />
                  <DetailRow label="Role" value={event.userRole} />
                  <DetailRow label="Template" value={getTemplateName(event)} />
                  <DetailRow label="Timezone" value={event.timezone || "UTC"} />
                  <DetailRow label="Photographer" value={photographerName} />
                  <DetailRow label="Validity Expires" value={formatDateTime(event.validityExpiresAt, event.timezone)} />
                  <DetailRow label="Started" value={formatDateTime(event.startedAt, event.timezone)} />
                  <DetailRow label="Ended" value={formatDateTime(event.endedAt, event.timezone)} />
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Links</h4>
                <div className="space-y-2">
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/10 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/30"
                  >
                    <ExternalLink className="h-4 w-4 text-primary" />
                    <span className="truncate">{publicUrl}</span>
                  </a>
                  <a
                    href={`${publicUrl}/analytics`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/10 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/30"
                  >
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span className="truncate">Analytics</span>
                  </a>
                  {event.hasCrewPin ? (
                    <a
                      href={`${publicUrl}/crew`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-border bg-muted/10 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/30"
                    >
                      <LinkIcon className="h-4 w-4 text-primary" />
                      <span className="truncate">Crew link</span>
                    </a>
                  ) : null}
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Stats</h4>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Current" value={Number(event.currentViewers) || 0} icon={<User className="h-3 w-3 text-primary" />} />
                  <StatCard label="Peak" value={Number(event.maxViewers) || 0} icon={<ShieldCheck className="h-3 w-3 text-primary" />} />
                  <StatCard label="Total Views" value={Number(event.totalViews) || 0} icon={<Eye className="h-3 w-3 text-primary" />} />
                </div>
              </section>
            </div>

            <div className="border-t border-border bg-muted/10 p-4">
              <Button className="w-full" asChild>
                <Link href={dashboardHref(event)}>View Full Event Dashboard</Link>
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

