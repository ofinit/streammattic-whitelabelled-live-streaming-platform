/**
 * Diagnostic script: Check if template_data is saved for events.
 * Run: node --env-file=.env.local scripts/check-template-data.js
 */
const { Pool } = require("pg")
const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL not set")
  process.exit(1)
}

const pool = new Pool({ connectionString: url })

async function main() {
  try {
    const res = await pool.query(`
      SELECT id, title, template_id, template_data, created_at
      FROM events
      ORDER BY created_at DESC
      LIMIT 10
    `)
    console.log(`Found ${res.rows.length} events (most recent 10):\n`)
    for (const row of res.rows) {
      const td = row.template_data
      const templateId = td?.templateId ?? "(none)"
      console.log(`  ${row.title}`)
      console.log(`    id: ${row.id}`)
      console.log(`    template_id (column): ${row.template_id ?? "null"}`)
      console.log(`    template_data.templateId: ${templateId}`)
      console.log(`    template_data: ${JSON.stringify(td)}`)
      console.log("")
    }
  } catch (err) {
    console.error("Error:", err.message)
    if (err.message?.includes("template_data") || err.message?.includes("does not exist")) {
      console.error("\nThe template_data column may not exist. Run: node --env-file=.env.local scripts/add-event-standard-fields.js")
    }
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
