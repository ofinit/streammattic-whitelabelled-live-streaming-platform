import { getClientGalleryAccessState } from "@/lib/photo-gallery-subscription"

/**
 * Active client gallery access: catalog listed + admin enabled + user opted in + subscription period not expired.
 * Same product rules as GET /api/photo-gallery-addon/status.
 */
export async function isClientGalleryEntitled(userId: string, role: string): Promise<boolean> {
  const { active } = await getClientGalleryAccessState(userId, role)
  return active
}

export {
  getClientGalleryAccessState,
  fetchPhotoGalleryEntitlementRow,
  resolveClientGalleryAccess,
  type ClientGalleryAccessReason,
  type PhotoGalleryEntitlementRow,
} from "@/lib/photo-gallery-subscription"
