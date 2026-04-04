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
