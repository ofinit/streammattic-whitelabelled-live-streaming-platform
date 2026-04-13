import { createWriteStream } from "fs"
import fs from "fs/promises"
import os from "os"
import path from "path"
import { pipeline } from "stream/promises"
import { Readable } from "stream"
import { createGunzip } from "zlib"
import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import {
  getBackupDir,
  isAdminDatabaseToolsEnabled,
  runPsqlFile,
  safePathInsideDir,
} from "@/lib/server/admin-database-tools"

export const runtime = "nodejs"
export const maxDuration = 300

const MAX_BYTES = 50 * 1024 * 1024

export async function POST(request: Request) {
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

  const contentLength = request.headers.get("content-length")
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 })
  }

  const modeRaw = String(form.get("mode") ?? "full_replace").trim()
  const source = String(form.get("source") ?? "upload").trim()

  if (modeRaw === "append" || modeRaw === "merge") {
    return NextResponse.json(
      {
        error:
          "Append and merge modes are not supported for generic .sql dumps. Use PostgreSQL custom format with pg_restore, or a purpose-built migration.",
        code: "NOT_IMPLEMENTED",
      },
      { status: 501 },
    )
  }

  if (modeRaw !== "full_replace" && modeRaw !== "schema_only") {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 })
  }

  if (source === "server") {
    const serverFilename = String(form.get("serverFilename") ?? "").trim()
    const backupDir = getBackupDir()
    const full = safePathInsideDir(backupDir, serverFilename)
    if (!full) {
      return NextResponse.json({ error: "Invalid serverFilename" }, { status: 400 })
    }
    let st: Awaited<ReturnType<typeof fs.stat>>
    try {
      st = await fs.stat(full)
    } catch {
      return NextResponse.json({ error: "Backup file not found" }, { status: 404 })
    }
    if (!st.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 400 })
    }
    if (st.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 })
    }

    const originalName = path.basename(full)
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sl-import-"))
    const sqlPath = path.join(tmpDir, "import.sql")
    try {
      const lower = originalName.toLowerCase()
      if (lower.endsWith(".gz")) {
        const src = await fs.open(full, "r")
        try {
          await pipeline(src.createReadStream(), createGunzip(), createWriteStream(sqlPath))
        } finally {
          await src.close()
        }
      } else {
        await fs.copyFile(full, sqlPath)
      }

      try {
        await fs.chmod(sqlPath, 0o600)
      } catch {
        // ignore on Windows
      }

      console.log(
        JSON.stringify({
          event: "admin_database_import",
          userId: user.id,
          mode: modeRaw,
          source: "server",
          bytes: st.size,
          file: originalName,
        }),
      )

      const result = await runPsqlFile(databaseUrl, sqlPath)
      if (!result.ok) {
        return NextResponse.json(
          { error: "Import failed (psql)", detail: result.stderr.slice(0, 8000) },
          { status: 500 },
        )
      }

      return NextResponse.json({ success: true, mode: modeRaw, file: originalName })
    } finally {
      await fs.rm(tmpDir, { recursive: true }).catch(() => {})
    }
  }

  const file = form.get("file")
  if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }

  const blob = file as Blob
  if (blob.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 })
  }

  const name =
    "name" in file && typeof (file as { name?: string }).name === "string"
      ? (file as { name: string }).name
      : "dump.sql"

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sl-import-"))
  const sqlPath = path.join(tmpDir, "import.sql")

  try {
    const buf = Buffer.from(await blob.arrayBuffer())
    const lower = name.toLowerCase()
    if (lower.endsWith(".gz")) {
      await pipeline(Readable.from(buf), createGunzip(), createWriteStream(sqlPath))
    } else {
      await fs.writeFile(sqlPath, buf)
    }

    try {
      await fs.chmod(sqlPath, 0o600)
    } catch {
      // ignore on Windows
    }

    console.log(
      JSON.stringify({
        event: "admin_database_import",
        userId: user.id,
        mode: modeRaw,
        source: "upload",
        bytes: buf.length,
        file: name,
      }),
    )

    const result = await runPsqlFile(databaseUrl, sqlPath)
    if (!result.ok) {
      return NextResponse.json(
        { error: "Import failed (psql)", detail: result.stderr.slice(0, 8000) },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, mode: modeRaw, file: name })
  } finally {
    await fs.rm(tmpDir, { recursive: true }).catch(() => {})
  }
}
