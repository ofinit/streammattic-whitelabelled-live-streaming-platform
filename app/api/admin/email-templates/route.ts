import { getDb } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"
import type { EmailTemplate } from "@/lib/types"

const DEFAULT_INACTIVE_USER_TEMPLATES = [
  {
    id: "inactive-onboarding",
    type: "inactive_onboarding",
    name: "Inactive: First event onboarding",
    subject: "Need help creating your first event?",
    description: "Sent to new users who have not created their first event.",
    variables: ["name", "dashboardUrl", "brandName"],
  },
  {
    id: "inactive-setup-help",
    type: "inactive_setup_help",
    name: "Inactive: Setup help",
    subject: "We can set up your next event",
    description: "Sent to users who tried setup once and then stopped.",
    variables: ["name", "dashboardUrl", "brandName"],
  },
  {
    id: "inactive-winback",
    type: "inactive_winback",
    name: "Inactive: Win-back",
    subject: "Ready for your next live event?",
    description: "Sent to prior users who have not hosted recently.",
    variables: ["name", "dashboardUrl", "brandName"],
  },
  {
    id: "inactive-renewal-offer",
    type: "inactive_renewal_offer",
    name: "Inactive: Renewal or wallet offer",
    subject: "Action needed to continue using the platform",
    description: "Sent to users blocked by wallet, credits, or renewal status.",
    variables: ["name", "dashboardUrl", "brandName"],
  },
  {
    id: "inactive-feature-awareness",
    type: "inactive_feature_awareness",
    name: "Inactive: Feature awareness",
    subject: "New ways to get more from your live events",
    description: "Sent to users who may not know about high-value platform features.",
    variables: ["name", "dashboardUrl", "brandName"],
  },
]

export const GET = withAuth(async (user, request) => {
  if (user.role !== "admin") return jsonError("Unauthorized", 403)
  
  const sql = getDb()
  // Try mapping from platform_settings first
  const rows = await sql`SELECT value FROM platform_settings WHERE key = 'email_templates'`
  
  if (rows.length > 0) {
    const configured = Array.isArray(rows[0].value) ? (rows[0].value as EmailTemplate[]) : []
    const ids = new Set(configured.map((template) => template.id).filter(Boolean))
    return jsonOk({
      templates: [
        ...configured,
        ...DEFAULT_INACTIVE_USER_TEMPLATES.filter((template) => !ids.has(template.id)),
      ],
    })
  }

  return jsonOk({ templates: DEFAULT_INACTIVE_USER_TEMPLATES })
})

export const POST = withAuth(async (user, request) => {
  if (user.role !== "admin") return jsonError("Unauthorized", 403)
  
  const body = await request.json()
  const { templates } = body
  const sql = getDb()

  if (!templates || !Array.isArray(templates)) {
    return jsonError("Invalid templates data")
  }

  await sql`
    INSERT INTO platform_settings (key, value) 
    VALUES ('email_templates', ${JSON.stringify(templates)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `

  return jsonOk({ success: true, message: "Email templates updated" })
})
