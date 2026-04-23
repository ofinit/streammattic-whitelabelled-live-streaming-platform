import { getDb } from "@/lib/db"
import { jsonError, withAuth } from "@/lib/api-helpers"
import { fetchGstInvoicePdfBytesById } from "@/lib/gst-invoice-fetch-pdf"
import { NextResponse } from "next/server"

export async function GET(request: Request, context: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await context.params
  const run = withAuth(async (user) => {
    if (!invoiceId) {
      return jsonError("invoiceId required", 400)
    }

    const sql = getDb()
    const rows = await sql`
      SELECT id, recipient_id, invoice_number
      FROM invoices
      WHERE id = ${invoiceId}
      LIMIT 1
    `

    if (rows.length === 0) {
      return jsonError("Invoice not found", 404)
    }

    const inv = rows[0] as Record<string, unknown>
    const recipientId = inv.recipient_id as string | null
    const role = user.role as string
    if (recipientId !== user.id && role !== "admin") {
      return jsonError("Forbidden", 403)
    }

    let pdfBytes: Uint8Array | null
    try {
      pdfBytes = await fetchGstInvoicePdfBytesById(invoiceId)
    } catch (pdfErr: unknown) {
      console.error("[invoices/pdf] PDF generation failed:", pdfErr)
      return jsonError("Failed to generate PDF", 500)
    }
    if (!pdfBytes) {
      return jsonError("Invoice not found", 404)
    }

    const filename = `invoice-${(inv.invoice_number as string) || invoiceId}.pdf`
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    })
  })

  return run(request)
}

