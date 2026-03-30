import { buildGstInvoicePdfFromRow } from "@/lib/gst-invoice-fetch-pdf"
import JSZip from "jszip"

type Sql = ReturnType<typeof import("@/lib/db").getDb>

function safeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]/g, "_")
}

export async function buildInvoicesZipFromRows(sql: Sql, rows: Record<string, unknown>[]): Promise<Buffer> {
  const zip = new JSZip()
  for (const row of rows) {
    const bytes = await buildGstInvoicePdfFromRow(sql, row)
    const num = safeFilename(String(row.invoice_number ?? row.id ?? "invoice"))
    zip.file(`gst-${num}.pdf`, Buffer.from(bytes))
  }
  const out = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
  return out as Buffer
}
