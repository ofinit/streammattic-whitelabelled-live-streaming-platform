import { NextResponse } from "next/server"
import { autoConfigureDomain } from "@/lib/cloudflare-dns"

export async function POST(req: Request) {
  try {
    const { domain, verificationToken, cfApiToken, cfZoneId } = await req.json()

    if (!domain || !verificationToken || !cfApiToken || !cfZoneId) {
      return NextResponse.json(
        { error: "Missing required fields: domain, verificationToken, cfApiToken, cfZoneId" },
        { status: 400 }
      )
    }

    const result = await autoConfigureDomain(
      cfApiToken,
      cfZoneId,
      domain,
      verificationToken
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
