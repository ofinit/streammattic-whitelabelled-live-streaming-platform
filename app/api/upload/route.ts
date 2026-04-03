import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { randomUUID } from "crypto"
import { getCurrentUser } from "@/lib/auth"
import { encodeBufferToWebp } from "@/lib/server/webp"
import { getPublicBaseUrl } from "@/lib/public-base-url"

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads")
const LANDING_SUBDIR = "landing-images"
const ALLOWED_SUBDIRS = ["landing-images", "event-hero", "event-player", "event-gallery", "event-photographer"]

const MAX_BATCH_FILES = 24
const MAX_SIZE = 8 * 1024 * 1024 // 8MB per file

/** Normalize odd browser MIME values (e.g. image/jpg) for allow-list checks */
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/avif",
])

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "file"
}

function isAllowedImageType(file: File): boolean {
  const t = (file.type || "").trim().toLowerCase()
  if (t && ALLOWED_TYPES.has(t)) return true
  if (t.startsWith("image/")) return true
  if (/\.(jpe?g|png|gif|webp|bmp|heic|heif|avif)$/i.test(file.name)) return true
  return false
}

/** Next/undici sometimes yields Blob; coalesce multipart `files` into real File instances */
function filesFromFormData(formData: FormData): File[] {
  const raw = formData.getAll("files")
  const out: File[] = []
  for (const entry of raw) {
    if (entry instanceof File) {
      out.push(entry)
    } else if (typeof Blob !== "undefined" && entry instanceof Blob) {
      out.push(new File([entry], "image.webp", { type: entry.type || "image/webp" }))
    }
  }
  if (out.length === 0) {
    const one = formData.get("files")
    if (one instanceof File) {
      out.push(one)
    } else if (typeof Blob !== "undefined" && one instanceof Blob) {
      out.push(new File([one], "image.webp", { type: one.type || "image/webp" }))
    }
  }
  return out
}

async function saveOneFileWebp(file: File, subdir: string, baseUrl: string): Promise<string> {
  if (!isAllowedImageType(file)) {
    throw new Error(`Invalid file type: ${file.name} (${file.type || "unknown"})`)
  }
  if (file.size > MAX_SIZE) {
    throw new Error(`File too large (max 8MB): ${file.name}`)
  }

  const dir = path.join(UPLOAD_DIR, subdir)
  await fs.mkdir(dir, { recursive: true })

  const raw = Buffer.from(await file.arrayBuffer())
  let webp: Buffer
  try {
    webp = await encodeBufferToWebp(raw)
  } catch (e) {
    const hint = e instanceof Error ? e.message : String(e)
    console.error("[upload] WebP encode failed:", hint)
    throw new Error(
      "Could not process this image. Use JPEG, PNG, WebP, or GIF. HEIC may be unsupported on this server.",
    )
  }

  const stem = sanitizeFilename(file.name.replace(/\.[^.]+$/, ""))
  const filename = `${Date.now()}-${randomUUID().replace(/-/g, "").slice(0, 12)}-${stem}.webp`
  const filepath = path.join(dir, filename)
  await fs.writeFile(filepath, webp)

  return `${baseUrl}/api/uploads/${subdir}/${filename}`
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await request.formData()
    const subdirRaw = (formData.get("subdir") as string) || LANDING_SUBDIR
    const subdir = ALLOWED_SUBDIRS.includes(subdirRaw) ? subdirRaw : "event-hero"

    const batchFiles = filesFromFormData(formData)

    const baseUrl = getPublicBaseUrl(request)

    if (batchFiles.length > 0) {
      if (batchFiles.length > MAX_BATCH_FILES) {
        return NextResponse.json({ error: `Too many files at once (max ${MAX_BATCH_FILES})` }, { status: 400 })
      }
      const urls: string[] = []
      const errors: string[] = []
      for (const f of batchFiles) {
        try {
          urls.push(await saveOneFileWebp(f, subdir, baseUrl))
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Save failed"
          errors.push(`${f.name}: ${msg}`)
        }
      }
      if (urls.length === 0) {
        return NextResponse.json(
          { error: errors[0] || "No files could be uploaded", errors },
          { status: 400 },
        )
      }
      return NextResponse.json({
        urls,
        url: urls[0],
        partialErrors: errors.length > 0 ? errors : undefined,
      })
    }

    const file = formData.get("file") as File | null
    if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    try {
      const url = await saveOneFileWebp(file, subdir, baseUrl)
      return NextResponse.json({
        url,
        urls: [url],
        filename: file.name,
        size: file.size,
        type: "image/webp",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed"
      return NextResponse.json({ error: message }, { status: 400 })
    }
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
