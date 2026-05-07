import { getDb } from "./db"

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
