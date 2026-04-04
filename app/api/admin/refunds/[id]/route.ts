import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireRole(["admin"])
    const { id } = await props.params
    const { status, reason } = await req.json()

    if (!status || !["approved", "rejected", "processing", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    const sql = getDb()
    
    // First, fetch the refund request to make sure it's valid to process
    const requests = await sql`SELECT * FROM refund_requests WHERE id = ${id}`
    if (requests.length === 0) {
      return NextResponse.json({ error: "Refund request not found" }, { status: 404 })
    }
    const refund = requests[0]

    // Update status
    if (status === "approved") {
      await sql`
        UPDATE refund_requests 
        SET status = 'approved', approved_by = ${adminUser.id}, approved_at = NOW() 
        WHERE id = ${id}
      `
      
      // Real cascade reversal logic (e.g. debiting the wallet of the requested_by)
      // would happen here, potentially utilizing a transaction
      
    } else if (status === "rejected") {
      // Assuming a generic metadata field or schema expansion for rejection reason
      await sql`
        UPDATE refund_requests 
        SET status = 'rejected' 
        WHERE id = ${id}
      `
    } else {
      await sql`
        UPDATE refund_requests 
        SET status = ${status} 
        WHERE id = ${id}
      `
    }

    return NextResponse.json({ success: true, message: "Refund status updated to " + status })
  } catch (error: any) {
    console.error("Admin Refund Status PATCH error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
