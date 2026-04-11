import { getDb } from "@/lib/db"
import { buildWalletRechargeGstInvoicePdf } from "@/lib/gst-invoice-pdf"
import { getPlatformGSTSettings } from "@/lib/platform-gst"

async function findOrderIdForPayment(
  sql: ReturnType<typeof getDb>,
  paymentId: string | undefined
): Promise<string> {
  if (!paymentId) return ""
  const r = await sql`SELECT order_id FROM payments WHERE id = ${paymentId} LIMIT 1`
  if (r.length === 0) return ""
  return String((r[0] as { order_id: string }).order_id ?? "")
}

/** Build wallet-recharge GST PDF bytes for a row from `invoices`. */
export async function buildGstInvoicePdfFromRow(
  sql: ReturnType<typeof getDb>,
  inv: Record<string, unknown>
): Promise<Uint8Array> {
  const platform = await getPlatformGSTSettings()
  const baseAmountPaise = Number(inv.base_amount ?? 0)
  const totalPaise = Number(inv.total_amount ?? 0)
  const gstPaise = Number(inv.total_gst_amount ?? 0)
  const gstPct = Number(inv.gst_percentage ?? 0)
  const paymentIdRow = inv.payment_id as string | undefined
  const invoiceId = inv.id as string
  const orderId = await findOrderIdForPayment(sql, paymentIdRow)

  return buildWalletRechargeGstInvoicePdf({
    invoiceNumber: (inv.invoice_number as string) || invoiceId,
    issuedAt: inv.invoice_date ? new Date(inv.invoice_date as string) : new Date(),
    platform,
    recipientName: (inv.recipient_name as string) || "Customer",
    recipientEmail: (inv.recipient_email as string) || "",
    recipientGstNumber: (inv.recipient_gst_number as string) || null,
    recipientAddress: (inv.recipient_address as string) || null,
    invoiceType: (inv.invoice_type as string) || null,
    baseAmountPaise,
    gstPercentage: gstPct,
    gstAmountPaise: gstPaise,
    totalPaidPaise: totalPaise,
    paymentId: paymentIdRow || "—",
    orderId: orderId || invoiceId,
  })
}

export async function fetchGstInvoicePdfBytesById(invoiceId: string): Promise<Uint8Array | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT *
    FROM invoices
    WHERE id = ${invoiceId}
    LIMIT 1
  `
  if (rows.length === 0) return null
  return buildGstInvoicePdfFromRow(sql, rows[0] as Record<string, unknown>)
}
