import fs from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getBackupDir, isAdminDatabaseToolsEnabled } from "@/lib/server/admin-database-tools"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET() {
  try {
    await requireRole(["admin"])
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ""
    if (msg === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isAdminDatabaseToolsEnabled()) {
    return NextResponse.json({ error: "Database tools are disabled", code: "TOOLS_DISABLED" }, { status: 403 })
  }

  const dir = getBackupDir()
  let entries: Awaited<ReturnType<typeof fs.readdir>>
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return NextResponse.json({ backups: [], directory: dir })
  }

  const files = entries.filter((e) => e.isFile())
  const stats = await Promise.all(
    files.map(async (e) => {
      const full = path.join(dir, e.name)
      const st = await fs.stat(full)
      return {
        name: e.name,
        size: st.size,
        mtime: st.mtime.toISOString(),
      }
    }),
  )

  stats.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime())

  return NextResponse.json({ backups: stats, directory: dir })
}
