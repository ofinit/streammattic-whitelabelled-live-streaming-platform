import type { ClientGalleryAccessReason } from "@/lib/photo-gallery-subscription"

export type PhotoGalleryStatusResponse = {
  entitled?: boolean
  eligible?: boolean
  accessReason?: ClientGalleryAccessReason
}

export function getGalleryPackagesHref(role: string | undefined): string {
  return role === "studio" ? "/studio/packages" : "/streamer/packages"
}

export function resolveClientGalleryLockedAction(args: {
  role: string | undefined
  status: PhotoGalleryStatusResponse | undefined
}): { label: string; href: string; description: string } {
  const href = getGalleryPackagesHref(args.role)
  const reason = args.status?.accessReason

  switch (reason) {
    case "subscription_expired":
      return {
        label: "Renew add-on",
        href,
        description: "Your gallery add-on has expired. Renew to restore albums, analytics, and uploads.",
      }
    case "not_opted_in":
      return {
        label: "Buy add-on",
        href,
        description: "Your account has access but no active plan. Buy the add-on to unlock gallery pages.",
      }
    case "admin_disabled":
    case "no_entitlement_row":
      return {
        label: "Activate add-on",
        href,
        description: "This service is disabled for your account. Activate it from Packages to continue.",
      }
    default:
      return {
        label: "Open Packages",
        href,
        description: "This service is currently unavailable for your account. Check Packages for activation options.",
      }
  }
}
