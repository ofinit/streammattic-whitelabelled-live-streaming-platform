/** Browser-only helpers to export the album guest-link QR for print (SVG vector + high-res PNG). */

const DEFAULT_PNG_PRINT_PX = 2048

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadAlbumQrSvg(qrWrap: HTMLElement | null, baseFilename = "album-qr") {
  const svg = qrWrap?.querySelector("svg")
  if (!svg) {
    throw new Error("QR not ready")
  }
  const serialized = new XMLSerializer().serializeToString(svg)
  const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" })
  triggerDownload(blob, `${baseFilename}.svg`)
}

/**
 * Raster export at fixed pixel size (default 2048) for print workflows that need PNG.
 */
export async function downloadAlbumQrPngPrint(
  qrWrap: HTMLElement | null,
  opts?: { pixelSize?: number; baseFilename?: string },
): Promise<void> {
  const pixelSize = opts?.pixelSize ?? DEFAULT_PNG_PRINT_PX
  const baseFilename = opts?.baseFilename ?? "album-qr"

  const svg = qrWrap?.querySelector("svg")
  if (!svg) {
    throw new Error("QR not ready")
  }
  const serialized = new XMLSerializer().serializeToString(svg)
  const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("Could not load QR for PNG export"))
      img.src = url
    })
    if (img.decode) {
      try {
        await img.decode()
      } catch {
        // ignore decode failure if onload fired
      }
    }

    const canvas = document.createElement("canvas")
    canvas.width = pixelSize
    canvas.height = pixelSize
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Could not create canvas context")
    }
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, pixelSize, pixelSize)

    const nw = img.naturalWidth || img.width || 1
    const nh = img.naturalHeight || img.height || 1
    const scale = Math.min(pixelSize / nw, pixelSize / nh)
    const dw = nw * scale
    const dh = nh * scale
    const ox = (pixelSize - dw) / 2
    const oy = (pixelSize - dh) / 2
    ctx.drawImage(img, ox, oy, dw, dh)

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b && b.size > 0) resolve(b)
        else reject(new Error("Could not create PNG"))
      }, "image/png")
    })
    triggerDownload(pngBlob, `${baseFilename}-print.png`)
  } finally {
    URL.revokeObjectURL(url)
  }
}
