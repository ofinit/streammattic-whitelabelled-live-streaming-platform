"use client"

import { useMemo, useState } from "react"
import { Mail, MessageSquare, Phone, StickyNote } from "lucide-react"
import { toast } from "sonner"
import {
  ADMIN_ENGAGEMENT_CAMPAIGNS,
  type AdminEngagementCampaignType,
  type AdminEngagementChannel,
  type AdminEngagementSummary,
} from "@/lib/admin-user-engagement"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/utils"

export type AdminEngagementUser = {
  id: string
  name: string
  email: string
  engagement?: AdminEngagementSummary
}

const SEGMENT_BADGE_CLASS: Record<string, string> = {
  new_never_activated: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  tried_once_stopped: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  value_user_at_risk: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  payment_blocked: "border-red-500/30 bg-red-500/10 text-red-400",
  feature_unaware: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
}

const CHANNEL_OPTIONS: Array<{ value: AdminEngagementChannel; label: string; icon: typeof Mail }> = [
  { value: "email", label: "Send email", icon: Mail },
  { value: "whatsapp", label: "Log WhatsApp", icon: MessageSquare },
  { value: "call", label: "Log call", icon: Phone },
  { value: "note", label: "Log note", icon: StickyNote },
]

export function EngagementSegmentBadge({ engagement }: { engagement?: AdminEngagementSummary }) {
  if (!engagement) return <Badge variant="outline">Unknown</Badge>
  return (
    <Badge variant="outline" className={SEGMENT_BADGE_CLASS[engagement.segment] || SEGMENT_BADGE_CLASS.active}>
      {engagement.segmentLabel}
    </Badge>
  )
}

export function EngagementSummary({ engagement }: { engagement?: AdminEngagementSummary }) {
  if (!engagement) return <span className="text-xs text-muted-foreground">No engagement data</span>
  const lastContact = engagement.lastContactedAt
    ? formatDate(engagement.lastContactedAt)
    : "Not contacted"
  const followUp = engagement.followUpAt ? `Follow up ${formatDate(engagement.followUpAt)}` : null
  return (
    <div className="space-y-1">
      <EngagementSegmentBadge engagement={engagement} />
      <p className="max-w-[220px] truncate text-xs text-muted-foreground" title={engagement.segmentReason}>
        {engagement.segmentReason}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {lastContact}
        {followUp ? ` · ${followUp}` : ""}
      </p>
      {engagement.note ? (
        <p className="max-w-[220px] truncate text-[11px] text-muted-foreground" title={engagement.note}>
          Note: {engagement.note}
        </p>
      ) : null}
    </div>
  )
}

export function EngagementBulkBar({
  selectedCount,
  onSend,
  onClear,
}: {
  selectedCount: number
  onSend: () => void
  onClear: () => void
}) {
  if (selectedCount === 0) return null
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-foreground">{selectedCount} user{selectedCount === 1 ? "" : "s"} selected for engagement</p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClear}>
          Clear
        </Button>
        <Button type="button" size="sm" onClick={onSend}>
          Send / log outreach
        </Button>
      </div>
    </div>
  )
}

export function AdminEngagementDialog({
  open,
  onOpenChange,
  users,
  onComplete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: AdminEngagementUser[]
  onComplete: () => void
}) {
  const [campaignType, setCampaignType] = useState<AdminEngagementCampaignType>("setup_help")
  const [channel, setChannel] = useState<AdminEngagementChannel>("email")
  const [note, setNote] = useState("")
  const [followUpAt, setFollowUpAt] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const title = users.length === 1 ? `Engage ${users[0]?.name || "user"}` : `Engage ${users.length} users`
  const selectedCampaign = useMemo(
    () => ADMIN_ENGAGEMENT_CAMPAIGNS.find((c) => c.type === campaignType),
    [campaignType],
  )

  const submit = async () => {
    if (users.length === 0) return
    setSubmitting(true)
    try {
      if (channel === "email") {
        const res = await fetch("/api/admin/users/engagement/campaign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            userIds: users.map((u) => u.id),
            campaignType,
            note,
            followUpAt: followUpAt || undefined,
          }),
        })
        const data = (await res.json().catch(() => ({}))) as { error?: string; sent?: number; failed?: number }
        if (!res.ok) {
          toast.error(data.error || "Failed to send campaign")
          return
        }
        toast.success(`Campaign sent to ${data.sent ?? 0} user${data.sent === 1 ? "" : "s"}${data.failed ? ` (${data.failed} failed)` : ""}`)
      } else {
        for (const user of users) {
          const res = await fetch(`/api/admin/users/${user.id}/engagement`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              campaignType,
              channel,
              note,
              followUpAt: followUpAt || undefined,
            }),
          })
          if (!res.ok) throw new Error(`Failed to log outreach for ${user.email}`)
        }
        toast.success(`Outreach logged for ${users.length} user${users.length === 1 ? "" : "s"}`)
      }
      setNote("")
      setFollowUpAt("")
      onOpenChange(false)
      onComplete()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Failed to save engagement")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Send an email campaign or log WhatsApp/call follow-up. Every action is stored in the user&apos;s engagement history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Campaign</Label>
            <Select value={campaignType} onValueChange={(v) => setCampaignType(v as AdminEngagementCampaignType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_ENGAGEMENT_CAMPAIGNS.map((campaign) => (
                  <SelectItem key={campaign.type} value={campaign.type}>
                    {campaign.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCampaign ? <p className="text-xs text-muted-foreground">{selectedCampaign.description}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as AdminEngagementChannel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {option.label}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="engagement-note">Message / internal note</Label>
            <Textarea
              id="engagement-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add context, offer details, or call notes..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="engagement-follow-up">Follow-up date</Label>
            <Input
              id="engagement-follow-up"
              type="datetime-local"
              value={followUpAt}
              onChange={(e) => setFollowUpAt(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={submitting}>
            {submitting ? "Saving..." : channel === "email" ? "Send email" : "Log outreach"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

