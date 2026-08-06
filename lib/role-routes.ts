import type { UserRole } from "@/lib/types"

/** Default app home path for a role (admin/studio/streamer shells). */
export function getRouteForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin"
    case "rtmp_operator":
    case "elive_operator":
      return "/admin/events"
    case "studio":
      return "/studio"
    case "streamer":
      return "/streamer"
    default:
      return "/streamer"
  }
}
