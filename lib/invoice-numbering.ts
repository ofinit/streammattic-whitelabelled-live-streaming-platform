import { getDb, withTransaction } from "./db"

type Sql = ReturnType<typeof getDb>

const INDIA_TIME_ZONE = "Asia/Kolkata"
const INVOICE_PREFIX = "INV"
const INVOICE_SEQUENCE_PADDING = 5

function getIndiaDateParts(date: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date)

  const year = Number(parts.find((part) => part.type === "year")?.value)
  const month = Number(parts.find((part) => part.type === "month")?.value)

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    throw new Error("Failed to derive India financial year for invoice date")
  }

  return { year, month }
}

export function getInvoiceFinancialYear(date = new Date()): string {
  const { year, month } = getIndiaDateParts(date)
  const startYear = month >= 4 ? year : year - 1
  const endYearSuffix = String((startYear + 1) % 100).padStart(2, "0")
  return `${startYear}-${endYearSuffix}`
}

export function formatInvoiceNumber(financialYear: string, sequenceNumber: number): string {
  return `${INVOICE_PREFIX}-${financialYear}-${String(sequenceNumber).padStart(INVOICE_SEQUENCE_PADDING, "0")}`
}

export async function ensureInvoiceSequenceTable(sql: Sql): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS invoice_sequences (
      financial_year TEXT PRIMARY KEY,
      next_number BIGINT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (next_number > 0)
    )
  `
}

export async function getNextInvoiceNumber(sql: Sql, invoiceDate = new Date()): Promise<string> {
  await ensureInvoiceSequenceTable(sql)

  const financialYear = getInvoiceFinancialYear(invoiceDate)
  const rows = await sql(
    `INSERT INTO invoice_sequences (financial_year, next_number)
     VALUES ($1, 2)
     ON CONFLICT (financial_year)
     DO UPDATE SET next_number = invoice_sequences.next_number + 1, updated_at = NOW()
     RETURNING next_number - 1 AS sequence_number`,
    [financialYear],
  )

  const sequenceNumber = Number(rows[0]?.sequence_number)
  if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1) {
    throw new Error(`Failed to allocate invoice number for FY ${financialYear}`)
  }

  return formatInvoiceNumber(financialYear, sequenceNumber)
}

export async function resequenceLegacyInvoiceNumbersIfNeeded(sql: Sql): Promise<void> {
  await ensureInvoiceSequenceTable(sql)

  const legacyRows = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM invoices
      WHERE invoice_number !~ '^INV-[0-9]{4}-[0-9]{2}-[0-9]{5}$'
      LIMIT 1
    ) AS has_legacy
  `
  if (legacyRows[0]?.has_legacy !== true) return

  await withTransaction(async (client) => {
    const lock = await client.query("SELECT pg_try_advisory_xact_lock($1) AS locked", [59427011])
    if (lock.rows[0]?.locked !== true) return

    const legacyCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM invoices
        WHERE invoice_number !~ '^INV-[0-9]{4}-[0-9]{2}-[0-9]{5}$'
        LIMIT 1
      ) AS has_legacy
    `)
    if (legacyCheck.rows[0]?.has_legacy !== true) return

    await client.query(`
      UPDATE invoices
      SET invoice_number = '__resequence__' || id::text
    `)

    await client.query(`
      WITH dated AS (
        SELECT
          id,
          invoice_date,
          CASE
            WHEN EXTRACT(MONTH FROM invoice_date AT TIME ZONE 'Asia/Kolkata') >= 4
              THEN EXTRACT(YEAR FROM invoice_date AT TIME ZONE 'Asia/Kolkata')::int
            ELSE EXTRACT(YEAR FROM invoice_date AT TIME ZONE 'Asia/Kolkata')::int - 1
          END AS fy_start
        FROM invoices
      ),
      numbered AS (
        SELECT
          id,
          fy_start::text || '-' || lpad(((fy_start + 1) % 100)::text, 2, '0') AS financial_year,
          row_number() OVER (
            PARTITION BY fy_start
            ORDER BY invoice_date ASC, id ASC
          ) AS sequence_number
        FROM dated
      )
      UPDATE invoices i
      SET
        invoice_number = 'INV-' || n.financial_year || '-' || lpad(n.sequence_number::text, 5, '0'),
        updated_at = NOW()
      FROM numbered n
      WHERE i.id = n.id
    `)

    await client.query(`
      WITH dated AS (
        SELECT
          id,
          invoice_date,
          CASE
            WHEN EXTRACT(MONTH FROM invoice_date AT TIME ZONE 'Asia/Kolkata') >= 4
              THEN EXTRACT(YEAR FROM invoice_date AT TIME ZONE 'Asia/Kolkata')::int
            ELSE EXTRACT(YEAR FROM invoice_date AT TIME ZONE 'Asia/Kolkata')::int - 1
          END AS fy_start
        FROM invoices
      ),
      numbered AS (
        SELECT
          fy_start::text || '-' || lpad(((fy_start + 1) % 100)::text, 2, '0') AS financial_year,
          row_number() OVER (
            PARTITION BY fy_start
            ORDER BY invoice_date ASC, id ASC
          ) AS sequence_number
        FROM dated
      ),
      maxes AS (
        SELECT financial_year, MAX(sequence_number) + 1 AS next_number
        FROM numbered
        GROUP BY financial_year
      )
      INSERT INTO invoice_sequences (financial_year, next_number)
      SELECT financial_year, next_number
      FROM maxes
      ON CONFLICT (financial_year)
      DO UPDATE SET next_number = EXCLUDED.next_number, updated_at = NOW()
    `)

    await client.query(`
      UPDATE wallet_transactions wt
      SET invoice_number = i.invoice_number
      FROM invoices i
      LEFT JOIN payments p ON p.id = i.payment_id
      WHERE (
        i.transaction_id = wt.id
        OR (
          p.order_id IS NOT NULL
          AND wt.reference_type = 'order'
          AND wt.reference_id = p.order_id::text
        )
      )
      AND wt.invoice_number IS DISTINCT FROM i.invoice_number
    `)
  })
}
