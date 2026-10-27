import { getDb } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"
import { getOwnerWhatsAppRaw, splitPhoneNumber } from "@/lib/event-whatsapp"

/**
 * Default WhatsApp number for the event form: the event owner's studio WhatsApp → support phone → account phone.
 * `?userId=` (event owner) is honoured for admins; everyone else gets their own default.
 */
export const GET = withAuth(async (user, request) => {
  const requested = new URL(request.url).searchParams.get("userId")
  const userId = requested && user.role === "admin" ? requested : (user.id as string)
  if (!userId) return jsonError("Unauthorized", 401)

  const raw = await getOwnerWhatsAppRaw(getDb(), userId)
  if (!raw) return jsonOk({ countryCode: null, number: null })
  return jsonOk(splitPhoneNumber(raw))
})
