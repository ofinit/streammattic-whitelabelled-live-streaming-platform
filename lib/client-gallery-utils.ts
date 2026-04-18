import { randomBytes } from "crypto"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

/** Unguessable token for public gallery URLs (hex, URL-safe). */
export function newPublicGalleryToken(): string {
  return randomBytes(32).toString("hex")
}

export function safeGalleryObjectFilename(name: string): string {
  const t = name.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 180)
  return t.length > 0 ? t : "image"
}

/**
 * Folder name under cg/{userId}/ — human-readable slug from title plus album id for uniqueness.
 * S3 "folders" are key prefixes; only [a-z0-9-] for broad compatibility.
 */
export function albumTitleToS3FolderSegment(title: string, albumId: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
  const base = slug.length > 0 ? slug : "album"
  return `${base}-${albumId}`
}

export const MAX_CLIENT_GALLERY_UPLOAD_BYTES = 50 * 1024 * 1024
