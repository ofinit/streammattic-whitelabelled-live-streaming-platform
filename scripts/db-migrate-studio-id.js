/**
 * Migration: Add studio_id to events and orders for studio-scoped queries.
 * Run: node --env-file=.env.local scripts/db-migrate-studio-id.js
 */
const { Client } = require("pg");
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set. Run with: node --env-file=.env.local scripts/db-migrate-studio-id.js");
  process.exit(1);
}

async function sql(client, query, params = []) {
  const result = await client.query(query, params);
  return { rows: result.rows };
}

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("=== Migration: Add studio_id to events and orders ===\n");

  // 1. Add studio_id to events if missing
  const eventsCols = await sql(client, `
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'studio_id'
  `);
  if ((eventsCols.rows || []).length === 0) {
    console.log("Adding studio_id to events...");
    await sql(client, `
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES users(id) ON DELETE SET NULL
    `);
    await sql(client, `CREATE INDEX IF NOT EXISTS idx_events_studio_id ON events(studio_id)`);
    console.log("  Done.");
  } else {
    console.log("events.studio_id already exists.");
  }

  // 2. Add studio_id to orders if missing
  const ordersCols = await sql(client, `
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'studio_id'
  `);
  if ((ordersCols.rows || []).length === 0) {
    console.log("Adding studio_id to orders...");
    await sql(client, `
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES users(id) ON DELETE SET NULL
    `);
    await sql(client, `CREATE INDEX IF NOT EXISTS idx_orders_studio_id ON orders(studio_id)`);
    console.log("  Done.");
  } else {
    console.log("orders.studio_id already exists.");
  }

  // 3. Create minimal packages table if missing (admin dashboard queries it)
  const pkgCheck = await sql(client, `
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'packages'
  `);
  if ((pkgCheck.rows || []).length === 0) {
    console.log("Creating minimal packages table...");
    await sql(client, `
      CREATE TABLE IF NOT EXISTS packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  Done.");
  } else {
    console.log("packages table already exists.");
  }

  console.log("\n=== Migration complete ===");
  await client.end();
}

run().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
