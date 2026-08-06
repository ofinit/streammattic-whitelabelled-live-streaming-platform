import { NextResponse } from "next/server"
import { autoConfigureDomain } from "@/lib/cloudflare-dns"
import {
  getCameraIngestDnsTarget,
  getPlatformARecordIp,
  getPlatformCnameTarget,
  PLATFORM_DNS_CONFIGURE_ENV_HINT,
} from "@/lib/platform-dns"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN
    const cfZoneId = process.env.CLOUDFLARE_ZONE_ID

    if (!cfApiToken || !cfZoneId) {
      return NextResponse.json(
        { error: "Cloudflare is not configured. Ask your platform admin to set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID." },
        { status: 503 }
      )
    }

    const { domain, verificationToken } = await req.json()

    if (!domain || !verificationToken) {
      return NextResponse.json(
        { error: "Missing required fields: domain, verificationToken" },
        { status: 400 }
      )
    }

    const normalizedDomain = String(domain).trim().toLowerCase()
    const sql = getDb()
    const domainRows = await sql`
      SELECT id, user_id FROM domains
      WHERE domain = ${normalizedDomain} AND verification_token = ${String(verificationToken).trim()}
      LIMIT 1
    `

    if (domainRows.length === 0) {
      return NextResponse.json({ error: "Domain or verification token not found" }, { status: 404 })
    }

    const domainRow = domainRows[0] as { user_id: string }
    if (user.role !== "admin" && String(domainRow.user_id) !== String(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const platformIp = getPlatformARecordIp() ?? ""
    if (!platformIp) {
      return NextResponse.json(
        { error: `Platform A record IP is not set. ${PLATFORM_DNS_CONFIGURE_ENV_HINT}` },
        { status: 503 },
      )
    }
    const cameraIngestTarget = getCameraIngestDnsTarget()

    const result = await autoConfigureDomain(
      cfApiToken,
      cfZoneId,
      domain,
      verificationToken,
      platformIp,
      getPlatformCnameTarget(),
      {
        includeCameraIngest: Boolean(cameraIngestTarget),
        cameraIngestTarget,
      },
    )

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Failed to configure DNS records",
          details: result.errors,
          records: result.records,
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `DNS records configured successfully for ${domain}`,
      records: result.records.map((r) => ({
        id: r.id,
        type: r.type,
        name: r.name,
        content: r.content,
      })),
    })
  } catch (error) {
    console.error("Cloudflare DNS configure error:", error)
    return NextResponse.json(
      { error: "Failed to configure DNS via Cloudflare" },
      { status: 500 }
    )
  }
}
