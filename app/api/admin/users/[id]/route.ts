import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"])
    const { id } = await props.params
    const { status } = await req.json()

    if (!status || !["active", "suspended", "pending", "deactivated"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    const sql = getDb()
    await sql`UPDATE users SET status = ${status}, updated_at = NOW() WHERE id = ${id}`

    return NextResponse.json({ success: true, message: `User status updated to ${status}` })
  } catch (error: any) {
    console.error("Admin User Status PATCH error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"])
    const { id } = await props.params
    const body = await req.json()

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Accept only known pricing keys to prevent arbitrary JSONB injection
    const allowed = ["streamTypePricing", "simulcastPricing", "validityTiers", "validityDefaultDays", "studioSubscription", "aiImagePricing", "bonusCredits"]
    const pricing: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) pricing[key] = body[key]
    }

    // NULL means "reset to master" — pass null explicitly to clear overrides
    const pricingValue = body.reset === true ? null : JSON.stringify(pricing)

    const sql = getDb()
    if (body.reset === true) {
      await sql`UPDATE users SET custom_pricing = NULL, updated_at = NOW() WHERE id = ${id}`
    } else {
      await sql`UPDATE users SET custom_pricing = ${pricingValue}::jsonb, updated_at = NOW() WHERE id = ${id}`
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Admin Custom Pricing PUT error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
