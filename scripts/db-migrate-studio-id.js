/**
 * Migration: Add studio_id to events and orders for studio-scoped queries.
 * Run: node --env-file=.env.local scripts/db-migrate-studio-id.js
 */
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set. Run with: node --env-file=.env.local scripts/db-migrate-studio-id.js");
  process.exit(1);
}

const url = new URL(DATABASE_URL.replace("postgres://", "https://").replace("postgresql://", "https://"));
const API_URL = `https://${url.hostname}/sql`;

async function sql(query, params = []) {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": DATABASE_URL,
    },
    body: JSON.stringify({ query, params }),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text.substring(0, 300)}`);
  return JSON.parse(text);
}

async function run() {
  console.log("=== Migration: Add studio_id to events and orders ===\n");

  // 1. Add studio_id to events if missing
  const eventsCols = await sql(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'studio_id'
  `);
  if ((eventsCols.rows || []).length === 0) {
    console.log("Adding studio_id to events...");
    await sql(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES users(id) ON DELETE SET NULL
    `);
    await sql(`CREATE INDEX IF NOT EXISTS idx_events_studio_id ON events(studio_id)`);
    console.log("  Done.");
  } else {
    console.log("events.studio_id already exists.");
  }

  // 2. Add studio_id to orders if missing
  const ordersCols = await sql(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'studio_id'
  `);
  if ((ordersCols.rows || []).length === 0) {
    console.log("Adding studio_id to orders...");
    await sql(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES users(id) ON DELETE SET NULL
    `);
    await sql(`CREATE INDEX IF NOT EXISTS idx_orders_studio_id ON orders(studio_id)`);
    console.log("  Done.");
  } else {
    console.log("orders.studio_id already exists.");
  }

  // 3. Create minimal packages table if missing (admin dashboard queries it)
  const pkgCheck = await sql(`
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'packages'
  `);
  if ((pkgCheck.rows || []).length === 0) {
    console.log("Creating minimal packages table...");
    await sql(`
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
}

run().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
