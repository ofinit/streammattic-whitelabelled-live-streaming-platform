import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads")

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await context.params
    if (!pathSegments?.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const subpath = pathSegments.join(path.sep)
    if (subpath.includes("..") || path.isAbsolute(subpath)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const resolved = path.resolve(UPLOAD_DIR, subpath)
    const uploadDirResolved = path.resolve(UPLOAD_DIR)
    if (!resolved.startsWith(uploadDirResolved)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const stat = await fs.stat(resolved).catch(() => null)
    if (!stat || !stat.isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const buffer = await fs.readFile(resolved)
    const ext = path.extname(resolved).toLowerCase()
    const mime: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    }
    const contentType = mime[ext] || "application/octet-stream"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
