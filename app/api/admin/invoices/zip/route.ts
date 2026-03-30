import { getDb } from "@/lib/db"
import { jsonError, withRole } from "@/lib/api-helpers"
import { parseInclusiveDateRange, parseMonthUtc } from "@/lib/invoices-date-range"
import { queryInvoicesInRange } from "@/lib/invoices-query"
import { buildInvoicesZipFromRows } from "@/lib/invoices-zip-build"
import { NextResponse } from "next/server"

/**
 * Admin: bulk-download GST invoice PDFs as a ZIP.
 * Query: `month=YYYY-MM` **or** `from=YYYY-MM-DD&to=YYYY-MM-DD`, optional `recipientId` (user UUID).
 */
export async function GET(request: Request) {
  const run = withRole(["admin"], async (_user, req) => {
    const url = new URL(req.url)
    const month = url.searchParams.get("month")
    const fromStr = url.searchParams.get("from")
    const toStr = url.searchParams.get("to")
    const recipientId = url.searchParams.get("recipientId")?.trim() || null

    let range: { from: Date; to: Date } | null = null
    let label: string
    if (month?.trim()) {
      range = parseMonthUtc(month.trim())
      label = month.trim()
    } else if (fromStr && toStr) {
      range = parseInclusiveDateRange(fromStr, toStr)
      label = `${fromStr}_to_${toStr}`
    } else {
      return jsonError("Provide month=YYYY-MM or from=YYYY-MM-DD and to=YYYY-MM-DD", 400)
    }
    if (!range) return jsonError("Invalid date range", 400)

    const sql = getDb()
    const rows = await queryInvoicesInRange(sql, range, { recipientId })
    if (rows.length === 0) {
      return jsonError("No invoices in this range", 404)
    }
    const buf = await buildInvoicesZipFromRows(sql, rows)
    const safeLabel = label.replace(/[^a-zA-Z0-9._-]/g, "_")
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
