import { jsonOk } from "@/lib/api-helpers"
import { CLIENT_GALLERY_TEMPLATES } from "@/lib/client-gallery-templates"

export const dynamic = "force-dynamic"

/** Public list of guest gallery layout templates (for the create-album wizard). */
export async function GET() {
  return jsonOk({ templates: CLIENT_GALLERY_TEMPLATES })
}
