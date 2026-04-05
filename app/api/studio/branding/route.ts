import { GET as getBranding, PUT as updateBranding } from "../../branding/route"
import { withRole } from "@/lib/api-helpers"

/**
 * Proxy for /api/branding specifically for Studio context.
 * Ensures consistent /api/studio/... URL structure for studio dashboard.
 */
export const GET = withRole(["studio", "admin"], async (user, request) => {
  return getBranding(request)
})
export const PUT = withRole(["studio", "admin"], async (user, request) => {
  return updateBranding(request)
})
