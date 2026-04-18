/**
 * Browser-only: resize (max edge) and encode as WebP via canvas.
 * Used before upload to reduce payload and standardize format.
 */
const DEFAULT_MAX_EDGE = 1920
const DEFAULT_QUALITY = 0.82

export async function compressImageFileToWebp(
  file: File,
  opts?: { maxEdge?: number; quality?: number; strictWebp?: boolean },
): Promise<File> {
  const maxEdge = opts?.maxEdge ?? DEFAULT_MAX_EDGE
  const quality = opts?.quality ?? DEFAULT_QUALITY
  const strictWebp = opts?.strictWebp === true

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error("Could not read this image. Try JPEG or PNG.")
  }

  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Could not create canvas context.")
    }
    ctx.drawImage(bitmap, 0, 0, w, h)

    let blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", quality)
    })
    // Safari and some older browsers may not support WebP export from canvas (blob is null).
    if (!blob || blob.size === 0) {
      if (strictWebp) {
        throw new Error(
          "This browser cannot export WebP from the canvas. Use Chrome or Edge for client gallery uploads, or update Safari.",
        )
      }
      blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.88)
      })
    }
    if (!blob || blob.size === 0) {
      throw new Error("Could not encode this image. Try JPEG or PNG.")
    }

    const base = file.name.replace(/\.[^.]+$/i, "") || "photo"
    const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)
    const ext = blob.type === "image/jpeg" ? "jpg" : "webp"
    const mime = blob.type === "image/jpeg" ? "image/jpeg" : "image/webp"
    return new File([blob], `${safeBase}.${ext}`, { type: mime, lastModified: Date.now() })
  } finally {
    bitmap.close()
  }
}
