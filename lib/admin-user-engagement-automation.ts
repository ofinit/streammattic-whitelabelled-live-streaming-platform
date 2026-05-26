import type {
  AdminEngagementCampaignType,
  AdminEngagementSegment,
  AdminEngagementSummary,
} from "@/lib/admin-user-engagement"

export const AUTOMATED_ENGAGEMENT_SOURCE = "automated_inactive_engagement"

export type AutomatedEngagementDecision = {
  shouldSend: boolean
  campaignType: AdminEngagementCampaignType | null
  reason: string
}

const SEGMENT_CAMPAIGNS: Record<Exclude<AdminEngagementSegment, "active">, AdminEngagementCampaignType> = {
  new_never_activated: "onboarding_help",
  tried_once_stopped: "setup_help",
  value_user_at_risk: "winback",
  payment_blocked: "renewal_offer",
  feature_unaware: "feature_awareness",
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function daysSince(value: string | null | undefined): number | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return Math.floor((Date.now() - parsed.getTime()) / MS_PER_DAY)
}

export function campaignForEngagementSegment(
  segment: AdminEngagementSegment,
): AdminEngagementCampaignType | null {
  return segment === "active" ? null : SEGMENT_CAMPAIGNS[segment]
}

export function shouldSendAutomatedEngagementEmail(
  engagement: AdminEngagementSummary,
  options?: {
    minContactGapDays?: number
    minSameCampaignGapDays?: number
  },
): AutomatedEngagementDecision {
  const campaignType = campaignForEngagementSegment(engagement.segment)
  if (!campaignType) {
    return { shouldSend: false, campaignType: null, reason: "User is active." }
  }

  const minContactGapDays = options?.minContactGapDays ?? 14
  const minSameCampaignGapDays = options?.minSameCampaignGapDays ?? 30
  const contactAgeDays = daysSince(engagement.lastContactedAt)

  if (contactAgeDays != null && contactAgeDays < minContactGapDays) {
    return {
      shouldSend: false,
      campaignType,
      reason: `Contacted ${contactAgeDays} day(s) ago; waiting ${minContactGapDays} days between automated touches.`,
    }
  }

  if (
    engagement.lastCampaignType === campaignType &&
    contactAgeDays != null &&
    contactAgeDays < minSameCampaignGapDays
  ) {
    return {
      shouldSend: false,
      campaignType,
      reason: `Same campaign sent ${contactAgeDays} day(s) ago; waiting ${minSameCampaignGapDays} days.`,
    }
  }

  return {
    shouldSend: true,
    campaignType,
    reason: engagement.segmentReason,
  }
}

