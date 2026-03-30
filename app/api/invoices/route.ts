import { getDb } from "@/lib/db"
import { jsonError, jsonOk, withAuth } from "@/lib/api-helpers"
import { parseInclusiveDateRange } from "@/lib/invoices-date-range"

function parseDateRange(searchParams: URLSearchParams): { from: Date; to: Date } | null {
  const fromStr = searchParams.get("from")
  const toStr = searchParams.get("to")
  if (!fromStr || !toStr) return null
  return parseInclusiveDateRange(fromStr, toStr)
}

/**
 * List GST (wallet recharge) invoices for the current user, or all / filtered for admin.
 * Query: from=YYYY-MM-DD&to=YYYY-MM-DD (required), optional recipientId (admin only, UUID).
 */
export async function GET(request: Request) {
  const run = withAuth(async (user) => {
    const role = user.role as string
    if (role !== "admin" && role !== "streamer" && role !== "studio") {
      return jsonError("Forbidden", 403)
    }

    const url = new URL(request.url)
    const range = parseDateRange(url.searchParams)
    if (!range) {
      return jsonError("Query params from and to are required (YYYY-MM-DD)", 400)
    }

    const recipientIdParam = url.searchParams.get("recipientId")?.trim() || null
    const sql = getDb()
    const { from, to } = range

    let rows: Record<string, unknown>[]
    if (role === "admin") {
      if (recipientIdParam) {
        rows = await sql(
          `SELECT id, invoice_number, invoice_date, recipient_id, recipient_name, recipient_email,
                  base_amount, total_gst_amount, total_amount, gst_percentage, payment_method, status
           FROM invoices
           WHERE invoice_date >= $1::timestamptz AND invoice_date <= $2::timestamptz
             AND recipient_id = $3::uuid
           ORDER BY invoice_date DESC`,
          [from.toISOString(), to.toISOString(), recipientIdParam],
        )
      } else {
        rows = await sql(
          `SELECT id, invoice_number, invoice_date, recipient_id, recipient_name, recipient_email,
                  base_amount, total_gst_amount, total_amount, gst_percentage, payment_method, status
           FROM invoices
           WHERE invoice_date >= $1::timestamptz AND invoice_date <= $2::timestamptz
           ORDER BY invoice_date DESC`,
          [from.toISOString(), to.toISOString()],
        )
      }
    } else {
      rows = await sql(
        `SELECT id, invoice_number, invoice_date, recipient_id, recipient_name, recipient_email,
                base_amount, total_gst_amount, total_amount, gst_percentage, payment_method, status
         FROM invoices
         WHERE invoice_date >= $1::timestamptz AND invoice_date <= $2::timestamptz
           AND recipient_id = $3::uuid
         ORDER BY invoice_date DESC`,
        [from.toISOString(), to.toISOString(), user.id as string],
      )
    }

    const invoices = rows.map((r) => {
      const row = r as Record<string, unknown>
      return {
        id: row.id,
        invoiceNumber: row.invoice_number,
        invoiceDate: row.invoice_date,
        recipientId: row.recipient_id,
        recipientName: row.recipient_name,
        recipientEmail: row.recipient_email,
        baseAmountPaise: Number(row.base_amount ?? 0),
        totalGstAmountPaise: Number(row.total_gst_amount ?? 0),
        totalAmountPaise: Number(row.total_amount ?? 0),
        gstPercentage: Number(row.gst_percentage ?? 0),
        paymentMethod: row.payment_method,
        status: row.status,
      }
    })

    return jsonOk({ invoices })
  })

  return run(request)
}
