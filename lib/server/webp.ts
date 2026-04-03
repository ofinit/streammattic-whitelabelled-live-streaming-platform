import sharp from "sharp"

const MAX_EDGE = 2560
const WEBP_QUALITY = 82

/**
 * Resize (if needed), auto-orient, and encode to WebP for storage under UPLOAD_DIR.
 */
export async function encodeBufferToWebp(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer()
}
