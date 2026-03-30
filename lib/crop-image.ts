import type { Area } from "react-easy-crop"

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener("load", () => resolve(img))
    img.addEventListener("error", reject)
    img.src = src
  })
}

/** Raster crop in natural image pixels (from react-easy-crop `croppedAreaPixels`). */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  mimeType: string = "image/jpeg",
  quality = 0.92,
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(pixelCrop.width)
  canvas.height = Math.round(pixelCrop.height)
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get canvas context")

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b)
        else reject(new Error("Could not export image"))
      },
      mimeType,
      quality,
    )
  })
}
