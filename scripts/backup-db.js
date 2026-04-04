/**
 * Full backup of Postgres DB to a local SQL file.
 *
 * Option A – pg_dump (recommended): Requires PostgreSQL client tools installed.
 *   Use a direct (non-pooled) connection string when possible.
 *
 * Option B – Node/pg fallback: No pg_dump needed; dumps data via pg client.
 *   Use your normal DATABASE_URL. Output is data-only INSERTs; run
 *   migrations on local first, then restore this file.
 *
 * Setup:
 *   In .env.local add: DATABASE_URL="postgresql://..." (or PRODUCTION_DATABASE_URL for source)
 *
 * Run:
 *   node --env-file=.env.local scripts/backup-db.js
 *   node --env-file=.env.local scripts/backup-db.js --api   # API-only (no pg_dump)
 *
 * Output: backups/postgres-backup-YYYYMMDD-HHMMSS.sql
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const PRODUCTION_DATABASE_URL = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;
if (!PRODUCTION_DATABASE_URL) {
  console.error("PRODUCTION_DATABASE_URL or DATABASE_URL not set. Add to .env.local and run:");
  console.error("  node --env-file=.env.local scripts/backup-db.js");
  process.exit(1);
}

const useApiOnly = process.argv.includes("--api");
const backupsDir = path.join(process.cwd(), "backups");
const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
const outFile = path.join(backupsDir, `postgres-backup-${timestamp}.sql`);

function runPgDump() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

    const args = [
      "-d", PRODUCTION_DATABASE_URL,
      "--no-owner",
      "--clean",
      "--if-exists",
      "-f", outFile,
    ];

    const child = spawn("pg_dump", args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
      env: process.env,
    });

    let stderr = "";
    child.stderr.on("data", (d) => { stderr += d; process.stderr.write(d); });
    child.stdout?.on("data", (d) => process.stdout.write(d));
    child.on("error", (err) => reject(new Error("pg_dump not found. Install PostgreSQL client tools or run with --api. " + err.message)));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error("pg_dump exited " + code + (stderr ? "\n" + stderr.slice(-500) : "")));
    });
  });
}

async function dumpViaPg() {
  const client = new Client({ connectionString: PRODUCTION_DATABASE_URL });
  await client.connect();

  const tablesRes = await client.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_schema, table_name
  `);
  const allTables = (tablesRes.rows || []).map((r) => r.table_name);
  const fkOrder = ["users", "platform_settings", "event_templates", "wallets", "user_credits", "sessions", "wallet_transactions", "credit_purchases", "credit_deductions", "events", "orders", "payments", "payment_gateway_configs", "notifications", "studio_branding", "domains", "refund_requests", "wallet_adjustments", "gst_configurations", "invoices", "youtube_channels"];
  const tables = [...fkOrder.filter((t) => allTables.includes(t)), ...allTables.filter((t) => !fkOrder.includes(t))];

  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
  const out = fs.createWriteStream(outFile, { encoding: "utf8" });

  out.write("-- Postgres data dump (data only). Run migrations on local DB first, then this file.\n");
  out.write("-- Generated: " + new Date().toISOString() + "\n\n");
  out.write("BEGIN;\n\n");

  function escapeCol(val, isJsonb = false) {
    if (val === null || val === undefined) return "NULL";
    if (isJsonb) {
      // For jsonb columns, serialize anything (bool, number, object, string) as JSON
      return "'" + JSON.stringify(val).replace(/'/g, "''") + "'::jsonb";
    }
    if (typeof val === "boolean") return val ? "true" : "false";
    if (typeof val === "number" && !Number.isNaN(val)) return String(val);
    if (typeof val === "object" && val !== null) return "'" + String(JSON.stringify(val)).replace(/'/g, "''") + "'";
    return "'" + String(val).replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
  }

  for (const table of tables) {
    const colsRes = await client.query(`
      SELECT column_name, data_type, udt_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [table]);
    const colDefs = colsRes.rows || [];
    const columns = colDefs.map((r) => r.column_name);
    if (columns.length === 0) continue;

    // Build a set of column names whose type is jsonb so we can cast correctly
    const jsonbCols = new Set(colDefs.filter((r) => r.udt_name === "jsonb").map((r) => r.column_name));

    const colList = columns.map((c) => `"${c}"`).join(", ");
    const rowsRes = await client.query(`SELECT * FROM "${table}"`);
    const rows = rowsRes.rows || [];

    if (rows.length === 0) continue;

    out.write(`-- Table: ${table} (${rows.length} rows)\n`);
    for (const row of rows) {
      const values = columns.map((col) => escapeCol(row[col], jsonbCols.has(col)));
      out.write(`INSERT INTO "${table}" (${colList}) VALUES (${values.join(", ")});\n`);
    }
    out.write("\n");
  }

  out.write("COMMIT;\n");
  out.end();
  await client.end();

  return new Promise((resolve, reject) => {
    out.on("finish", resolve);
    out.on("error", reject);
  });
}

async function main() {
  if (useApiOnly) {
    console.log("Using pg client (data-only dump). Run migrations on local DB before restore.");
    await dumpViaPg();
  } else {
    try {
      await runPgDump();
    } catch (e) {
      console.error("pg_dump failed:", e.message);
      console.log("\nFalling back to pg client (data-only). Run with --api to skip pg_dump next time.");
      await dumpViaPg();
    }
  }

  console.log("Backup written to:", outFile);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
