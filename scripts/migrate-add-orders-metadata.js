/**
 * Adds JSON metadata to orders for wallet recharge GST breakdown.
 * Safe to run multiple times.
 */
const { Client } = require("pg")

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set")
  process.exit(1)
}

async function run() {
  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()
  try {
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb`)
    console.log("orders.metadata: OK")
  } finally {
    await client.end()
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
