import { getDb } from "@/lib/db"
import { jsonError, withAuth } from "@/lib/api-helpers"
import { parseInclusiveDateRange } from "@/lib/invoices-date-range"
import { queryInvoicesInRange } from "@/lib/invoices-query"
import { buildInvoicesZipFromRows } from "@/lib/invoices-zip-build"
import { NextResponse } from "next/server"

/**
 * Streamer / studio: download own GST invoices in a date range as ZIP.
 * Query: `from=YYYY-MM-DD&to=YYYY-MM-DD` (required).
 */
export async function GET(request: Request) {
  const run = withAuth(async (user) => {
    const role = user.role as string
    if (role !== "streamer" && role !== "studio") {
      return jsonError("Forbidden", 403)
    }

    const url = new URL(request.url)
    const fromStr = url.searchParams.get("from")
    const toStr = url.searchParams.get("to")
    if (!fromStr || !toStr) {
      return jsonError("Query params from and to are required (YYYY-MM-DD)", 400)
    }
    const range = parseInclusiveDateRange(fromStr, toStr)
    if (!range) return jsonError("Invalid date range", 400)

    const sql = getDb()
    const rows = await queryInvoicesInRange(sql, range, { recipientId: user.id as string })
    if (rows.length === 0) {
      return jsonError("No invoices in this range", 404)
    }
    const buf = await buildInvoicesZipFromRows(sql, rows)
    const safeLabel = `${fromStr}_to_${toStr}`.replace(/[^a-zA-Z0-9._-]/g, "_")
    const filename = `gst-invoices-${safeLabel}.zip`
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    })
  })
  return run(request)
}
