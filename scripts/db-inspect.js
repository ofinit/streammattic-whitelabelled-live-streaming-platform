/**
 * Production DB inspection script.
 * Run: node --env-file=.env.local scripts/db-inspect.js
 * Or: $env:DATABASE_URL=(Get-Content .env.local | Where-Object {$_ -match '^DATABASE_URL='} | ForEach-Object {$_ -replace '^DATABASE_URL=',''}) ; node scripts/db-inspect.js
 */
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set. Run with: node --env-file=.env.local scripts/db-inspect.js");
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
  console.log("=== Production DB Inspection ===\n");

  // 1. Connection test
  const conn = await sql("SELECT current_database() as db, current_user as usr");
  console.log("Connected:", conn.rows?.[0] || conn);

  // 2. List tables
  const tables = await sql(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  const tableNames = (tables.rows || []).map((r) => r.table_name);
  console.log("\nTables (" + tableNames.length + "):", tableNames.join(", "));

  // 3. Row counts
  console.log("\nRow counts:");
  for (const t of tableNames) {
    try {
      const r = await sql(`SELECT COUNT(*)::int as c FROM "${t}"`);
      const c = r.rows?.[0]?.c ?? r.rows?.[0]?.c ?? "?";
      console.log("  " + t + ": " + c);
    } catch (e) {
      console.log("  " + t + ": error - " + e.message.substring(0, 60));
    }
  }

  // 4. Check ENUMs
  const enums = await sql(`
    SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname IN ('user_role', 'user_status', 'event_status', 'stream_type_key', 'order_type', 'order_status', 'txn_category')
    GROUP BY t.typname
  `);
  console.log("\nKey ENUMs:");
  (enums.rows || []).forEach((r) => console.log("  " + r.typname + ":", (r.values || []).join(", ")));

  // 5. Check for schema drift: user_role values in DB
  const roleCheck = await sql(`
    SELECT role::text, COUNT(*) as cnt FROM users GROUP BY role
  `);
  console.log("\nUser roles in DB:", (roleCheck.rows || []).map((r) => r.role + ": " + r.cnt).join(", "));

  // 6. Check sessions table structure
  const sessCols = await sql(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions'
    ORDER BY ordinal_position
  `);
  console.log("\nSessions columns:", (sessCols.rows || []).map((r) => r.column_name).join(", "));

  // 7. Check if studio_branding exists
  const hasBranding = tableNames.includes("studio_branding");
  console.log("\nstudio_branding table:", hasBranding ? "exists" : "MISSING");

  // 8. Check domains table
  const hasDomains = tableNames.includes("domains");
  console.log("domains table:", hasDomains ? "exists" : "MISSING");

  // 9. Check youtube_channels
  const hasYoutube = tableNames.includes("youtube_channels");
  console.log("youtube_channels table:", hasYoutube ? "exists" : "MISSING");

  // 10. Sample admin user (no password)
  const admins = await sql(`SELECT id, email, name, role, status FROM users WHERE role = 'admin' LIMIT 3`);
  console.log("\nAdmin users:", (admins.rows || []).length);
  (admins.rows || []).forEach((r) => console.log("  -", r.email, "(" + r.status + ")"));

  // 11. Check events and orders columns
  const eventsCols = await sql(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events'
    ORDER BY ordinal_position
  `);
  const ordersCols = await sql(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders'
    ORDER BY ordinal_position
  `);
  const eventsHasStudioId = (eventsCols.rows || []).some((r) => r.column_name === "studio_id");
  const ordersHasStudioId = (ordersCols.rows || []).some((r) => r.column_name === "studio_id");
  const ordersHasTotal = (ordersCols.rows || []).some((r) => r.column_name === "total" || r.column_name === "total_price");
  console.log("\nSchema checks (app expects):");
  console.log("  events.studio_id:", eventsHasStudioId ? "exists" : "MISSING");
  console.log("  orders.studio_id:", ordersHasStudioId ? "exists" : "MISSING");
  console.log("  orders.total/total_price:", ordersHasTotal ? "exists" : "check");

  console.log("\n=== Inspection complete ===");
}

run().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
