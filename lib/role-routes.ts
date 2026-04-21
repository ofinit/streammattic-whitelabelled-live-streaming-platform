import type { UserRole } from "@/lib/types"

/** Default app home path for a role (admin/studio/streamer shells). */
export function getRouteForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin"
    case "studio":
      return "/studio"
    case "streamer":
      return "/streamer"
    default:
      return "/streamer"
  }
}
