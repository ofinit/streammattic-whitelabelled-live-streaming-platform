export type AdminEngagementSegment =
  | "new_never_activated"
  | "tried_once_stopped"
  | "value_user_at_risk"
  | "payment_blocked"
  | "feature_unaware"
  | "active"

export type AdminEngagementCampaignType =
  | "onboarding_help"
  | "setup_help"
  | "winback"
  | "renewal_offer"
  | "feature_awareness"

export type AdminEngagementChannel = "email" | "whatsapp" | "call" | "note"
export type AdminEngagementStatus = "sent" | "failed" | "logged"

export type AdminEngagementCampaign = {
  type: AdminEngagementCampaignType
  label: string
  description: string
}

export type AdminEngagementSummary = {
  segment: AdminEngagementSegment
  segmentLabel: string
  segmentReason: string
  priority: "low" | "medium" | "high"
  totalEvents: number
  completedEvents: number
  lastEventAt: string | null
  lastLiveAt: string | null
  totalCreditsRemaining: number
  lastContactedAt: string | null
  lastCampaignType: AdminEngagementCampaignType | null
  followUpAt: string | null
  note: string | null
}

export type AdminEngagementInput = {
  role: string
  createdAt: string | Date | null
  lastLoginAt: string | Date | null
  totalEvents: number
  completedEvents: number
  lastEventAt: string | Date | null
  lastLiveAt: string | Date | null
  walletBalance: number
  totalCreditsRemaining: number
  studioSubscriptionExpiresAt?: string | Date | null
  photoGalleryEnabled?: boolean
  lastContactedAt?: string | Date | null
  lastCampaignType?: string | null
  followUpAt?: string | Date | null
  note?: string | null
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export const ADMIN_ENGAGEMENT_CAMPAIGNS: AdminEngagementCampaign[] = [
  {
    type: "onboarding_help",
    label: "Onboarding help",
    description: "For new users who have not created their first event.",
  },
  {
    type: "setup_help",
    label: "Setup help",
    description: "For users who tried once and need hands-on help.",
  },
  {
    type: "winback",
    label: "Win-back",
    description: "For previously valuable users who have gone quiet.",
  },
  {
    type: "renewal_offer",
    label: "Renewal / wallet offer",
    description: "For users blocked by low wallet, credits, or expired studio access.",
  },
  {
    type: "feature_awareness",
    label: "Feature awareness",
    description: "For active accounts that have not used high-value features.",
  },
]

export const ADMIN_ENGAGEMENT_SEGMENT_LABELS: Record<AdminEngagementSegment, string> = {
  new_never_activated: "New, not activated",
  tried_once_stopped: "Tried once, stopped",
  value_user_at_risk: "Value user at risk",
  payment_blocked: "Payment blocked",
  feature_unaware: "Feature unaware",
  active: "Active",
}

export function normalizeCampaignType(value: unknown): AdminEngagementCampaignType {
  const raw = typeof value === "string" ? value : ""
  return ADMIN_ENGAGEMENT_CAMPAIGNS.some((c) => c.type === raw)
    ? (raw as AdminEngagementCampaignType)
    : "setup_help"
}

export function normalizeEngagementChannel(value: unknown): AdminEngagementChannel {
  return value === "whatsapp" || value === "call" || value === "note" ? value : "email"
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function toIso(value: string | Date | null | undefined): string | null {
  const d = toDate(value)
  return d ? d.toISOString() : null
}

function daysSince(value: string | Date | null | undefined): number | null {
  const d = toDate(value)
  if (!d) return null
  return Math.floor((Date.now() - d.getTime()) / MS_PER_DAY)
}

export function classifyAdminUserEngagement(input: AdminEngagementInput): AdminEngagementSummary {
  const totalEvents = Math.max(0, Number(input.totalEvents || 0))
  const completedEvents = Math.max(0, Number(input.completedEvents || 0))
  const walletBalance = Math.max(0, Number(input.walletBalance || 0))
  const totalCreditsRemaining = Math.max(0, Number(input.totalCreditsRemaining || 0))
  const lastActivityAt = toIso(input.lastLiveAt) ?? toIso(input.lastEventAt) ?? toIso(input.lastLoginAt) ?? toIso(input.createdAt)
  const inactiveDays = daysSince(lastActivityAt)
  const loginDays = daysSince(input.lastLoginAt)
  const createdDays = daysSince(input.createdAt)
  const subscriptionExpiry = toDate(input.studioSubscriptionExpiresAt)
  const subscriptionExpired = input.role === "studio" && !!subscriptionExpiry && subscriptionExpiry.getTime() < Date.now()
  const paymentBlocked = subscriptionExpired || (totalEvents > 0 && walletBalance <= 0 && totalCreditsRemaining <= 0)

  let segment: AdminEngagementSegment = "active"
  let reason = "Recent login or event activity."
  let priority: AdminEngagementSummary["priority"] = "low"

  if (paymentBlocked) {
    segment = "payment_blocked"
    reason = subscriptionExpired
      ? "Studio subscription is expired."
      : "No wallet balance or credits after prior usage."
    priority = "high"
  } else if (totalEvents === 0 && (loginDays == null || loginDays >= 1 || (createdDays ?? 0) >= 1)) {
    segment = "new_never_activated"
    reason = "No event has been created yet."
    priority = (createdDays ?? 0) >= 7 ? "high" : "medium"
  } else if (totalEvents <= 1 && (inactiveDays ?? 0) >= 14) {
    segment = "tried_once_stopped"
    reason = "Only one event or setup attempt, with no recent activity."
    priority = (inactiveDays ?? 0) >= 30 ? "high" : "medium"
  } else if (completedEvents > 0 && (inactiveDays ?? 0) >= 30) {
    segment = "value_user_at_risk"
    reason = "Previously hosted events but inactive for 30+ days."
    priority = (inactiveDays ?? 0) >= 60 ? "high" : "medium"
  } else if (
    totalEvents > 0 &&
    (input.role === "studio" || input.photoGalleryEnabled === false) &&
    (inactiveDays ?? 0) >= 7
  ) {
    segment = "feature_unaware"
    reason = "Has used the platform but may not know about newer growth features."
    priority = "medium"
  }

  return {
    segment,
    segmentLabel: ADMIN_ENGAGEMENT_SEGMENT_LABELS[segment],
    segmentReason: reason,
    priority,
    totalEvents,
    completedEvents,
    lastEventAt: toIso(input.lastEventAt),
    lastLiveAt: toIso(input.lastLiveAt),
    totalCreditsRemaining,
    lastContactedAt: toIso(input.lastContactedAt),
    lastCampaignType: input.lastCampaignType ? normalizeCampaignType(input.lastCampaignType) : null,
    followUpAt: toIso(input.followUpAt),
    note: input.note?.trim() || null,
  }
}

