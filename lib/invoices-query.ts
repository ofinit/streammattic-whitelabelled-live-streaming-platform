import { getDb } from "@/lib/db"
import { resequenceLegacyInvoiceNumbersIfNeeded } from "@/lib/invoice-numbering"

type Sql = ReturnType<typeof getDb>

export async function queryInvoicesInRange(
  sql: Sql,
  range: { from: Date; to: Date },
  options: { recipientId: string | null },
): Promise<Record<string, unknown>[]> {
  const { from, to } = range
  const { recipientId } = options
  const fromIso = from.toISOString()
  const toIso = to.toISOString()
  await resequenceLegacyInvoiceNumbersIfNeeded(sql)

  if (recipientId) {
    return sql(
      `SELECT *
       FROM invoices
       WHERE invoice_date >= $1::timestamptz AND invoice_date <= $2::timestamptz
         AND recipient_id = $3::uuid
       ORDER BY invoice_date ASC`,
      [fromIso, toIso, recipientId],
    )
  }
  return sql(
    `SELECT *
     FROM invoices
     WHERE invoice_date >= $1::timestamptz AND invoice_date <= $2::timestamptz
     ORDER BY invoice_date ASC`,
    [fromIso, toIso],
  )
}
