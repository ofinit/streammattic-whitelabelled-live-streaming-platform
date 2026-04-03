/**
 * One-shot: apply schema to local Postgres then restore the latest backup.
 * No psql or pg_dump required; uses Node + pg.
 *
 * Prerequisites:
 *   - PostgreSQL installed and running locally.
 *   - Database created: createdb streamlivee_local (or CREATE DATABASE streamlivee_local;)
 *   - In .env.local: DATABASE_URL=postgresql://postgres:YOURPASSWORD@localhost:5432/streamlivee_local
 *   - Backup exists: backups/postgres-backup-*.sql (from npm run db:backup)
 *
 * Run:
 *   node --env-file=.env.local scripts/setup-local-from-backup.js
 *
 * Then: npm run dev (app will use local DB).
 */

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set. Use .env.local with your local Postgres URL.");
  process.exit(1);
}

const backupsDir = path.join(process.cwd(), "backups");
const schemaPath = path.join(process.cwd(), "scripts", "001-schema.sql");

function getLatestBackup() {
  if (!fs.existsSync(backupsDir)) {
    throw new Error("backups/ not found. Run npm run db:backup first.");
  }
  const files = fs.readdirSync(backupsDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".sql"))
    .map((d) => ({ name: d.name, path: path.join(backupsDir, d.name), mtime: fs.statSync(path.join(backupsDir, d.name)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  if (files.length === 0) throw new Error("No .sql file in backups/. Run npm run db:backup first.");
  return files[0].path;
}

async function main() {
  const backupPath = getLatestBackup();
  console.log("Using backup:", path.basename(backupPath));

  if (!fs.existsSync(schemaPath)) {
    throw new Error("scripts/001-schema.sql not found.");
  }

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    console.log("Applying schema (001-schema.sql)...");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    try {
      await client.query(schemaSql);
    } catch (e) {
      if (!e.message.includes("already exists")) throw e;
      console.log("Schema objects already exist, continuing.");
    }
    console.log("Schema applied.");

    console.log("Restoring backup data...");
    const backupSql = fs.readFileSync(backupPath, "utf8");
    await client.query(backupSql);
    console.log("Restore done.");
  } finally {
    await client.end();
  }

  console.log("\nLocal DB is ready. Run: npm run dev");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
