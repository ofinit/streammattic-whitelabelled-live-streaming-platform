import fs from "fs"
import path from "path"
import { spawn } from "child_process"
import { Client } from "pg"
import { getDb } from "@/lib/db"

/** Resolve directory for server-side backup listing / import-from-server. */
export function getBackupDir(): string {
  const raw = process.env.BACKUP_DIR?.trim()
  if (raw) return path.resolve(raw)
  return path.join(process.cwd(), "backups")
}

export function isAdminDatabaseToolsEnabled(): boolean {
  return process.env.ADMIN_DATABASE_TOOLS_ENABLED === "true"
}

const FK_ORDER = [
  "users",
  "platform_settings",
  "event_templates",
  "wallets",
  "user_credits",
  "sessions",
  "wallet_transactions",
  "credit_purchases",
  "credit_deductions",
  "events",
  "orders",
  "payments",
  "payment_gateway_configs",
  "notifications",
  "studio_branding",
  "domains",
  "refund_requests",
  "wallet_adjustments",
  "gst_configurations",
  "invoices",
  "youtube_channels",
]

export async function publicTableExists(tableName: string): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    SELECT 1 AS x
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${tableName} AND table_type = 'BASE TABLE'
    LIMIT 1
  `
  return rows.length > 0
}

function escapeCol(val: unknown, jsonbCols: Set<string>, col: string): string {
  const isJsonb = jsonbCols.has(col)
  if (val === null || val === undefined) return "NULL"
  if (isJsonb) {
    return "'" + JSON.stringify(val).replace(/'/g, "''") + "'::jsonb"
  }
  if (typeof val === "boolean") return val ? "true" : "false"
  if (typeof val === "number" && !Number.isNaN(val)) return String(val)
  if (typeof val === "object" && val !== null) return "'" + String(JSON.stringify(val)).replace(/'/g, "''") + "'"
  return "'" + String(val).replace(/'/g, "''").replace(/\\/g, "\\\\") + "'"
}

/**
 * Data-only SQL dump to a file (pg fallback when pg_dump is unavailable). Skips listed tables.
 */
export async function writeDataOnlyDumpToFile(
  databaseUrl: string,
  outPath: string,
  skipTables: Set<string>,
): Promise<void> {
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `)
    const allTables = (tablesRes.rows as { table_name: string }[]).map((r) => r.table_name)
    const tables = [
      ...FK_ORDER.filter((t) => allTables.includes(t) && !skipTables.has(t)),
      ...allTables.filter((t) => !FK_ORDER.includes(t) && !skipTables.has(t)),
    ]

    const out = fs.createWriteStream(outPath, { encoding: "utf8" })
    out.write("-- Postgres data dump (data only). Run migrations on target DB first, then this file.\n")
    out.write("-- Generated: " + new Date().toISOString() + "\n\n")
    out.write("BEGIN;\n\n")

    for (const table of tables) {
      const colsRes = await client.query(
        `
        SELECT column_name, udt_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `,
        [table],
      )
      const colDefs = colsRes.rows as { column_name: string; udt_name: string }[]
      const columns = colDefs.map((r) => r.column_name)
      if (columns.length === 0) continue

      const jsonbCols = new Set(colDefs.filter((r) => r.udt_name === "jsonb").map((r) => r.column_name))
      const colList = columns.map((c) => `"${c}"`).join(", ")
      const rowsRes = await client.query(`SELECT * FROM "${table}"`)
      const rows = rowsRes.rows as Record<string, unknown>[]
      if (rows.length === 0) continue

      out.write(`-- Table: ${table} (${rows.length} rows)\n`)
      for (const row of rows) {
        const values = columns.map((col) => escapeCol(row[col], jsonbCols, col))
        out.write(`INSERT INTO "${table}" (${colList}) VALUES (${values.join(", ")});\n`)
      }
      out.write("\n")
    }

    out.write("COMMIT;\n")
    out.end()
    await new Promise<void>((resolve, reject) => {
      out.on("finish", () => resolve())
      out.on("error", reject)
    })
  } finally {
    await client.end()
  }
}

export type PgDumpOptions = {
  databaseUrl: string
  outPath: string
  schemaOnly: boolean
  excludeTables: string[]
}

/** Run pg_dump to a file. Returns stderr tail on failure. */
export function runPgDumpToFile(opts: PgDumpOptions): Promise<{ ok: true } | { ok: false; stderr: string }> {
  const args = [
    "-d",
    opts.databaseUrl,
    "--no-owner",
    "--clean",
    "--if-exists",
    "-f",
    opts.outPath,
  ]
  if (opts.schemaOnly) {
    args.push("--schema-only")
  }
  for (const t of opts.excludeTables) {
    args.push("-T", t)
  }

  return new Promise((resolve) => {
    const child = spawn("pg_dump", args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    })
    let stderr = ""
    child.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString()
    })
    child.on("error", () => {
      resolve({ ok: false, stderr: stderr || "pg_dump spawn failed (is PostgreSQL client installed?)" })
    })
    child.on("close", (code) => {
      if (code === 0) resolve({ ok: true })
      else resolve({ ok: false, stderr: stderr.slice(-4000) || `pg_dump exited ${code}` })
    })
  })
}

/** Run psql -f against DATABASE_URL. */
export function runPsqlFile(databaseUrl: string, sqlPath: string): Promise<{ ok: true } | { ok: false; stderr: string }> {
  return new Promise((resolve) => {
    const args = ["-d", databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", sqlPath]
    const child = spawn("psql", args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    })
    let stderr = ""
    let stdout = ""
    child.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString()
    })
    child.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString()
    })
    child.on("error", () => {
      resolve({ ok: false, stderr: stderr || stdout || "psql spawn failed (is PostgreSQL client installed?)" })
    })
    child.on("close", (code) => {
      if (code === 0) resolve({ ok: true })
      else resolve({ ok: false, stderr: (stderr + "\n" + stdout).slice(-8000) || `psql exited ${code}` })
    })
  })
}

/** Ensure resolved path is inside baseDir (no traversal). `filename` must be a plain basename (no path separators). */
export function safePathInsideDir(baseDir: string, filename: string): string | null {
  const trimmed = filename.trim()
  if (!trimmed || trimmed.includes("..") || /[/\\]/.test(trimmed)) {
    return null
  }
  const base = path.resolve(baseDir)
  const safeName = path.basename(trimmed)
  if (safeName !== trimmed) return null
  const full = path.resolve(base, safeName)
  const rel = path.relative(base, full)
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null
  return full
}
