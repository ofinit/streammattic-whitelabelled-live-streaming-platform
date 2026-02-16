import { NextResponse } from "next/server"
import { verifyApiToken, getZonesByToken } from "@/lib/cloudflare-dns"

export async function POST(req: Request) {
  try {
    const { cfApiToken } = await req.json()

    if (!cfApiToken || typeof cfApiToken !== "string") {
      return NextResponse.json(
        { error: "Cloudflare API token is required" },
        { status: 400 }
      )
    }

    // Verify the token is valid
    const verification = await verifyApiToken(cfApiToken)
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.message, valid: false, zones: [] },
        { status: 200 }
      )
    }

    // Get zones the token has access to
    const zones = await getZonesByToken(cfApiToken)

    return NextResponse.json({
      valid: true,
      message: "Token verified successfully",
      zones: zones.map((z) => ({
        id: z.id,
        name: z.name,
        status: z.status,
      })),
    })
  } catch (error) {
    console.error("Cloudflare token verification error:", error)
    return NextResponse.json(
      { error: "Failed to verify Cloudflare token" },
      { status: 500 }
    )
  }
}
