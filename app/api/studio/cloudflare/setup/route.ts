import { getDb } from "@/lib/db"
import { getPlatformSetting } from "@/lib/db-queries"
import { autoConfigureDomain, verifyApiToken, getZonesByToken } from "@/lib/cloudflare-dns"
import { jsonOk, jsonError, withAuth, withRole } from "@/lib/api-helpers"

export const POST = withRole(["studio", "admin"], async (user, request) => {
  try {
    const body = await request.json()
    const { apiToken, zoneId, domainId } = body

    if (!apiToken || !zoneId || !domainId) {
      return jsonError("apiToken, zoneId, and domainId are required")
    }

    const sql = getDb()
    let domainName = ""
    let verificationToken = ""

    if (domainId === "platform") {
      // Platform-wide setup
      if (user.role !== "admin") return jsonError("Forbidden", 403)
      domainName = (await getPlatformSetting("platform_domain")) as string
      verificationToken = `streamlivee-verify-platform` // Generic or custom token
      if (!domainName) return jsonError("Platform domain not configured in settings", 400)
    } else {
      // Studio-specific setup
      const domains = await sql`SELECT * FROM domains WHERE id = ${domainId} ${user.role === "admin" ? sql`` : sql`AND user_id = ${user.id}`}`
      if (domains.length === 0) return jsonError("Domain record not found", 404)
      const domainRecord = domains[0]
      domainName = domainRecord.domain as string
      verificationToken = domainRecord.verification_token as string
    }

    // 2. Get Platform settings for IP/CNAME
    const platformIp = (await getPlatformSetting("platform_a_record_ip")) as string
    const cnameTarget = (await getPlatformSetting("platform_cname_target")) as string || process.env.NEXT_PUBLIC_PLATFORM_CNAME_TARGET

    if (!platformIp) {
      return jsonError("Platform IP not configured by administrator. Please contact support.")
    }

    // 3. Trigger Cloudflare Auto-Config
    const result = await autoConfigureDomain(
      apiToken,
      zoneId,
      domainName,
      verificationToken,
      platformIp,
      cnameTarget
    )

    if (!result.success) {
      return jsonError(`Cloudflare Setup Failed: ${result.errors.join(", ")}`)
    }

    // 4. Optionally mark as 'verifying' or similar in DB (logic for cron/polling will handle final verification)
    
    return jsonOk({ 
      message: "DNS records created successfully! Verification may take a few minutes.",
      records: result.records 
    })
  } catch (err) {
    console.error("Cloudflare Setup API Error:", err)
    return jsonError("Internal server error during Cloudflare setup")
  }
})

// Helper to list zones for the UI
export const GET = withRole(["studio", "admin"], async (user, request) => {
  const url = new URL(request.url)
  const apiToken = url.searchParams.get("apiToken")

  if (!apiToken) return jsonError("apiToken is required")

  try {
    const verification = await verifyApiToken(apiToken)
    if (!verification.valid) return jsonError(verification.message)

    const zones = await getZonesByToken(apiToken)
    return jsonOk({ zones })
  } catch (err) {
    return jsonError("Failed to fetch zones from Cloudflare")
  }
})
