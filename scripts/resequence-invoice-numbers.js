const { Client } = require("pg")

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set")
  process.exit(1)
}

const dryRun = process.argv.includes("--dry-run")

const sequenceTableSql = `
CREATE TABLE IF NOT EXISTS invoice_sequences (
  financial_year TEXT PRIMARY KEY,
  next_number BIGINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (next_number > 0)
)`

const numberedInvoicesCte = `
WITH dated AS (
  SELECT
    id,
    invoice_number AS old_invoice_number,
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
    old_invoice_number,
    invoice_date,
    fy_start,
    fy_start::text || '-' || lpad(((fy_start + 1) % 100)::text, 2, '0') AS financial_year,
    row_number() OVER (
      PARTITION BY fy_start
      ORDER BY invoice_date ASC, id ASC
    ) AS sequence_number
  FROM dated
)`

async function main() {
  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()

  try {
    await client.query("BEGIN")
    await client.query(sequenceTableSql)

    const preview = await client.query(`
      ${numberedInvoicesCte}
      SELECT
        financial_year,
        old_invoice_number,
        'INV-' || financial_year || '-' || lpad(sequence_number::text, 5, '0') AS new_invoice_number,
        invoice_date
      FROM numbered
      ORDER BY invoice_date ASC, id ASC
      LIMIT 20
    `)

    await client.query(`
      UPDATE invoices
      SET invoice_number = '__resequence__' || id::text
    `)

    const updated = await client.query(`
      ${numberedInvoicesCte}
      UPDATE invoices i
      SET
        invoice_number = 'INV-' || n.financial_year || '-' || lpad(n.sequence_number::text, 5, '0'),
        updated_at = NOW()
      FROM numbered n
      WHERE i.id = n.id
      RETURNING i.id, i.invoice_number
    `)

    await client.query(`
      ${numberedInvoicesCte},
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

    const walletRows = await client.query(`
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

    const sequences = await client.query(`
      SELECT financial_year, next_number
      FROM invoice_sequences
      ORDER BY financial_year
    `)

    if (dryRun) {
      await client.query("ROLLBACK")
    } else {
      await client.query("COMMIT")
    }

    console.log(`${dryRun ? "DRY RUN" : "UPDATED"} invoice rows: ${updated.rowCount}`)
    console.log(`Wallet transaction invoice references updated: ${walletRows.rowCount}`)
    console.log("Preview (first 20 by invoice date):")
    console.table(preview.rows)
    console.log("Invoice sequence counters:")
    console.table(sequences.rows)
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
