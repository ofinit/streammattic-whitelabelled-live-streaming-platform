/**
 * Restore a Postgres backup file into the database pointed to by DATABASE_URL.
 *
 * Prerequisites:
 *   - DATABASE_URL in .env.local (local or any Postgres).
 *   - For full backup (pg_dump): run this script; it will drop and recreate from backup.
 *   - For data-only backup (--api): run migrations first so schema exists, then run this.
 *
 * Run:
 *   node --env-file=.env.local scripts/restore-local.js
 *   node --env-file=.env.local scripts/restore-local.js backups/postgres-backup-20250108120000.sql
 *
 * Uses Node + pg if psql is not in PATH.
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set. Use .env.local with your database URL.");
  process.exit(1);
}

const backupArg = process.argv[2];
const backupsDir = path.join(process.cwd(), "backups");

let sqlFile;
if (backupArg) {
  sqlFile = path.isAbsolute(backupArg) ? backupArg : path.join(process.cwd(), backupArg);
  if (!fs.existsSync(sqlFile)) {
    console.error("File not found:", sqlFile);
    process.exit(1);
  }
} else {
  if (!fs.existsSync(backupsDir)) {
    console.error("No backups/ folder. Run backup-db.js (npm run db:backup) first.");
    process.exit(1);
  }
  const files = fs.readdirSync(backupsDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".sql"))
    .map((d) => ({ name: d.name, path: path.join(backupsDir, d.name), mtime: fs.statSync(path.join(backupsDir, d.name)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  if (files.length === 0) {
    console.error("No .sql backup found in backups/. Run backup-db.js first or pass a file.");
    process.exit(1);
  }
  sqlFile = files[0].path;
  console.log("Using latest backup:", path.basename(sqlFile));
}

function runPsql() {
  return new Promise((resolve, reject) => {
    const args = ["-d", DATABASE_URL, "-f", sqlFile, "-v", "ON_ERROR_STOP=1"];
    const child = spawn("psql", args, {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    child.on("error", () => reject(new Error("psql not found")));
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error("psql exited " + code))));
  });
}

async function runWithPg() {
  const { Client } = require("pg");
  const sql = fs.readFileSync(sqlFile, "utf8");
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

runPsql()
  .then(() => console.log("Restore completed (psql)."))
  .catch(async (psqlErr) => {
    try {
      await runWithPg();
      console.log("Restore completed (Node/pg).");
    } catch (pgErr) {
      console.error("psql failed:", psqlErr.message);
      console.error("Node/pg failed:", pgErr.message);
      console.error("Ensure DATABASE_URL is valid and the database exists. For API (data-only) backups, run migrations first.");
      process.exit(1);
    }
  });
