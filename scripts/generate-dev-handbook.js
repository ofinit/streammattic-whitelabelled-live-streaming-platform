/**
 * Regenerates the AUTO-GENERATED section in docs/DEVELOPMENT_HANDBOOK.md.
 * Repo metadata always; optional Postgres schema snapshot when DATABASE_URL is set
 * (e.g. node --env-file=.env.local scripts/generate-dev-handbook.js).
 */

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const ROOT = path.join(__dirname, "..")
const HANDBOOK = path.join(ROOT, "docs", "DEVELOPMENT_HANDBOOK.md")
const BEGIN = "<!-- AUTO-GENERATED:BEGIN -->"
const END = "<!-- AUTO-GENERATED:END -->"

function gitShortSha() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim()
  } catch {
    return "unknown"
  }
}

/** ISO timestamp of HEAD commit — stable for a given checkout (CI-friendly). */
function gitCommitDateIso() {
  try {
    return execSync("git log -1 --format=%cI", { cwd: ROOT, encoding: "utf8" }).trim()
  } catch {
    return new Date().toISOString()
  }
}

function findApiRoutes() {
  const apiRoot = path.join(ROOT, "app", "api")
  const out = []
  function walk(dir) {
    if (!fs.existsSync(dir)) return
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name)
      const st = fs.statSync(full)
      if (st.isDirectory()) walk(full)
      else if (name === "route.ts") out.push(path.relative(ROOT, full).replace(/\\/g, "/"))
    }
  }
  walk(apiRoot)
  return out.sort()
}

function routeToUrlPattern(filePath) {
  const rel = filePath.replace(/^app\/api\//, "").replace(/\/route\.ts$/, "")
  return "/api/" + rel
    .replace(/\[\.{3}path\]/g, "[...path]")
    .replace(/\[([^\]]+)\]/g, "[$1]")
}

function pickDeps(pkg) {
  const keys = ["next", "react", "react-dom", "next-auth", "pg", "@upstash/redis", "zod", "@stackframe/stack"]
  const d = pkg.dependencies || {}
  const lines = []
  for (const k of keys) {
    if (d[k]) lines.push(`| \`${k}\` | ${d[k]} |`)
  }
  return lines.length ? lines.join("\n") : "| *(none)* | |"
}

async function buildDbSnapshot() {
  const url = process.env.DATABASE_URL
  if (!url) {
    return [
      "",
      "*Schema snapshot skipped: `DATABASE_URL` is not set.*",
      "",
      "To include a snapshot from your database, run with an env file, for example:",
      "",
      "```bash",
      "node --env-file=.env.local scripts/generate-dev-handbook.js",
      "```",
      "",
    ].join("\n")
  }

  let Client
  try {
    Client = require("pg").Client
  } catch (e) {
    return `\n*Could not load pg: ${e.message}*\n`
  }

  const client = new Client({ connectionString: url })
  try {
    await client.connect()
    const r = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `)
    const byTable = new Map()
    for (const row of r.rows) {
      const t = row.table_name
      if (!byTable.has(t)) byTable.set(t, [])
      byTable.get(t).push(
        `\`${row.column_name}\` ${row.data_type}${row.is_nullable === "YES" ? " null" : " not null"}`
      )
    }
    const tables = [...byTable.keys()].sort()
    const parts = [
      "",
      `*Connected database host (redacted): ${redactUrlHost(url)}*`,
      "",
      "| Table | Columns |",
      "| --- | --- |",
    ]
    for (const t of tables) {
      const cols = byTable.get(t)
      const summary = cols.length > 12 ? cols.slice(0, 12).join(", ") + ", …" : cols.join(", ")
      parts.push(`| \`${t}\` | ${summary} |`)
    }
    parts.push("")
    return parts.join("\n")
  } catch (e) {
    return [
      "",
      `*Schema snapshot failed: ${String(e.message || e).slice(0, 200)}*`,
      "",
    ].join("\n")
  } finally {
    try {
      await client.end()
    } catch {
      /* ignore */
    }
  }
}

function redactUrlHost(url) {
  try {
    const u = new URL(url)
    return `${u.protocol}//${u.hostname}:${u.port || "5432"}/${u.pathname.replace(/^\//, "")}`
  } catch {
    return "(invalid URL)"
  }
}

function buildGeneratedBlock(dbSection) {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"))
  const routes = findApiRoutes()
  const generatedAt = gitCommitDateIso()
  const sha = gitShortSha()

  const routeRows = routes
    .map((f) => `| \`${f}\` | \`${routeToUrlPattern(f)}\` |`)
    .join("\n")

  return [
    BEGIN,
    "",
    "## Generated snapshot",
    "",
    "| Field | Value |",
    "| --- | --- |",
    "| Snapshot time (HEAD commit, ISO) | `" + generatedAt + "` |",
    "| Git revision | `" + sha + "` |",
    "| Package | `" + (pkg.name || "unknown") + "@" + (pkg.version || "0.0.0") + "` |",
    "",
    "### Key dependencies",
    "",
    "| Package | Version |",
    "| --- | --- |",
    pickDeps(pkg),
    "",
    "### App Router API modules (`route.ts`)",
    "",
    "These files define HTTP handlers; URL shape follows Next.js dynamic segments.",
    "",
    "| File | Approx. URL prefix |",
    "| --- | --- |",
    routeRows,
    "",
    "### Database (from `DATABASE_URL` at generation time)",
    "",
    dbSection.trimEnd(),
    "",
    END,
  ].join("\n")
}

async function main() {
  const dbSection = await buildDbSnapshot()
  const block = buildGeneratedBlock(dbSection)

  let text = fs.readFileSync(HANDBOOK, "utf8")
  const i = text.indexOf(BEGIN)
  const j = text.indexOf(END)
  if (i === -1 || j === -1 || j < i) {
    console.error("Missing AUTO-GENERATED markers in", HANDBOOK)
    process.exit(1)
  }
  const before = text.slice(0, i)
  const after = text.slice(j + END.length)
  const next = before + block + after
  fs.writeFileSync(HANDBOOK, next, "utf8")
  console.log("Updated", path.relative(ROOT, HANDBOOK))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
