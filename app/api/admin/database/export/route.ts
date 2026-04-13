import { createReadStream } from "fs"
import fs from "fs/promises"
import os from "os"
import path from "path"
import { Readable } from "stream"
import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import {
  isAdminDatabaseToolsEnabled,
  publicTableExists,
  runPgDumpToFile,
  writeDataOnlyDumpToFile,
} from "@/lib/server/admin-database-tools"

export const runtime = "nodejs"
export const maxDuration = 300

function exportFilenameStamp(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  const h = String(d.getUTCHours()).padStart(2, "0")
  const min = String(d.getUTCMinutes()).padStart(2, "0")
  const s = String(d.getUTCSeconds()).padStart(2, "0")
  return `${y}${m}${day}-${h}${min}${s}`
}

export async function GET(request: NextRequest) {
  let user: Awaited<ReturnType<typeof requireRole>>
  try {
    user = await requireRole(["admin"])
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ""
    if (msg === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isAdminDatabaseToolsEnabled()) {
    return NextResponse.json({ error: "Database tools are disabled", code: "TOOLS_DISABLED" }, { status: 403 })
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const schemaOnly = searchParams.get("schemaOnly") === "true"
  const skipFileUploads = searchParams.get("skipFileUploads") === "true"

  const excludeTables: string[] = []
  if (skipFileUploads && (await publicTableExists("file_uploads"))) {
    excludeTables.push("file_uploads")
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sl-export-"))
  const tmpFile = path.join(tmpDir, "dump.sql")

  try {
    console.log(
      JSON.stringify({
        event: "admin_database_export",
        userId: user.id,
        schemaOnly,
        skipFileUploads,
      }),
    )

    const pgDump = await runPgDumpToFile({
      databaseUrl,
      outPath: tmpFile,
      schemaOnly,
      excludeTables,
    })

    if (!pgDump.ok) {
      if (schemaOnly) {
        return NextResponse.json(
          {
            error:
              "Schema-only export requires pg_dump. Install PostgreSQL client tools on the server or use a host that provides pg_dump.",
            detail: pgDump.stderr.slice(0, 2000),
          },
          { status: 503 },
        )
      }
      const skip = new Set<string>()
      if (skipFileUploads) skip.add("file_uploads")
      await writeDataOnlyDumpToFile(databaseUrl, tmpFile, skip)
    }

    const filename = `streamlivee-export-${exportFilenameStamp()}.sql`
    const rs = createReadStream(tmpFile)
    rs.on("close", () => {
      fs.rm(tmpDir, { recursive: true }).catch(() => {})
    })
    rs.on("error", () => {
      fs.rm(tmpDir, { recursive: true }).catch(() => {})
    })

    return new Response(Readable.toWeb(rs) as ReadableStream<Uint8Array>, {
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    await fs.rm(tmpDir, { recursive: true }).catch(() => {})
    console.error("admin database export failed", err)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
