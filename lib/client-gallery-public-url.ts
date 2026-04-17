/**
 * Absolute public URL for guest QR / sharing (client gallery viewer).
 */
export function getClientGalleryViewerAbsoluteUrl(publicToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || ""
  const path = `/client-gallery/v/${encodeURIComponent(publicToken)}`
  if (!base) return path
  return `${base}${path}`
}
