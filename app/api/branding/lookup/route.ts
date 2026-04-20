import { jsonOk, jsonError } from "@/lib/api-helpers"
import { NextRequest } from "next/server"
import { getBrandingLookupByHost } from "@/lib/server/branding-lookup-by-host"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const hostname =
    searchParams.get("hostname") || searchParams.get("w") || searchParams.get("host")

  if (!hostname) {
    return jsonError("Hostname required")
  }

  try {
    const payload = await getBrandingLookupByHost(hostname)
    if (payload.isWhiteLabel) {
      return jsonOk({
        isWhiteLabel: true,
        branding: payload.branding,
        userId: payload.userId,
      })
    }
    return jsonOk({
      isWhiteLabel: false,
      branding: payload.branding,
    })
  } catch (e) {
    console.error("[branding/lookup]", e)
    return jsonError("Lookup failed", 500)
  }
}
