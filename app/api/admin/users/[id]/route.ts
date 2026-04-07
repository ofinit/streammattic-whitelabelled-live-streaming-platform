import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"])
    const { id } = await props.params
    const body = await req.json()
    const { name, phone, status, branding } = body

    const sql = getDb()

    // 1. Update User Basic Info
    if (name || phone || status) {
       const setClause: string[] = []
       if (name) setClause.push(`name = ${name}`)
       if (phone) setClause.push(`phone = ${phone}`)
       if (status) {
         if (!["active", "suspended", "pending", "deactivated"].includes(status)) {
           return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
         }
         setClause.push(`status = ${status}`)
       }

       // We use a safe manual update or just separate updates for simplicity if only few fields
       // For better performance we can combine, but here we just update if set
       await sql`
         UPDATE users 
         SET 
           name = COALESCE(${name ?? null}, name),
           phone = COALESCE(${phone ?? null}, phone),
           status = COALESCE(${status ?? null}, status),
           updated_at = NOW() 
         WHERE id = ${id}
       `
    }

    // 2. Update Branding if provided
    if (branding) {
       const { platformName, primaryColor, secondaryColor } = branding
       await sql`
         INSERT INTO studio_branding (user_id, platform_name, primary_color, secondary_color)
         VALUES (${id}, ${platformName}, ${primaryColor}, ${secondaryColor})
         ON CONFLICT (user_id) DO UPDATE SET 
           platform_name = COALESCE(${platformName ?? null}, platform_name),
           primary_color = COALESCE(${primaryColor ?? null}, primary_color),
           secondary_color = COALESCE(${secondaryColor ?? null}, secondary_color),
           updated_at = NOW()
       `
    }

    return NextResponse.json({ success: true, message: "Studio updated successfully" })
  } catch (error: any) {
    console.error("Admin Studio Update PATCH error:", error)
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
