import { getDb } from "@/lib/db"
import { jsonError, jsonOk, withAuth } from "@/lib/api-helpers"
import {
  getIndianStateName,
  isValidGstinFormat,
  isValidIndianStateCode,
  normalizeIndianMobile,
  type GstProfileType,
} from "@/lib/indian-states"

const GST_TYPES: GstProfileType[] = ["individual", "business_registered", "business_unregistered"]

export const GET = withAuth(async (user) => {
  const sql = getDb()
  const uid = user.id as string

  const urows = await sql`
    SELECT phone, billing_state FROM users WHERE id = ${uid} LIMIT 1
  `
  const u = urows[0] as Record<string, unknown> | undefined

  const grows = await sql`
    SELECT gst_type, gst_number, business_name, business_address, city, state, pincode
    FROM gst_configurations WHERE user_id = ${uid} LIMIT 1
  `

  if (!u) {
    return jsonError("User not found", 404)
  }

  const g = grows[0] as Record<string, unknown> | undefined
  return jsonOk({
    phone: (u.phone as string) ?? null,
    billingState: (u.billing_state as string) ?? null,
    gstType: (g?.gst_type as GstProfileType) ?? "individual",
    gstNumber: (g?.gst_number as string) ?? "",
    businessName: (g?.business_name as string) ?? "",
    businessAddress: (g?.business_address as string) ?? "",
    city: (g?.city as string) ?? "",
    state: (g?.state as string) ?? "",
    pincode: (g?.pincode as string) ?? "",
  })
})

export const PUT = withAuth(async (user, request) => {
  const uid = user.id as string
  const body = (await request.json()) as Record<string, unknown>

  const billingStateCode = body.billingState
  const gstType = body.gstType
  const gstNumber = typeof body.gstNumber === "string" ? body.gstNumber.trim().toUpperCase() : ""
  const businessName = typeof body.businessName === "string" ? body.businessName.trim() : ""
  const businessAddress = typeof body.businessAddress === "string" ? body.businessAddress.trim() : ""
  const city = typeof body.city === "string" ? body.city.trim() : ""
  const pincode = typeof body.pincode === "string" ? body.pincode.trim() : ""

  const sql = getDb()
  const urow = await sql`SELECT phone FROM users WHERE id = ${uid} LIMIT 1`
  const storedPhone = (urow[0] as Record<string, unknown> | undefined)?.phone as string | null | undefined
  const mobileNorm = normalizeIndianMobile(String(storedPhone ?? "").trim())
  if (!mobileNorm) {
    return jsonError(
      "Add a valid 10-digit mobile number in Profile (above) before saving billing details.",
      400,
    )
  }

  if (typeof billingStateCode !== "string" || !isValidIndianStateCode(billingStateCode)) {
    return jsonError("State is required (valid code)", 400)
  }
  const code = billingStateCode.trim().toUpperCase()
  const stateLabel = getIndianStateName(code)

  if (typeof gstType !== "string" || !GST_TYPES.includes(gstType as GstProfileType)) {
    return jsonError("Invalid gstType", 400)
  }

  if (gstNumber && !isValidGstinFormat(gstNumber)) {
    return jsonError("Invalid GSTIN format (15 characters)", 400)
  }

  await sql`
    UPDATE users
    SET phone = ${mobileNorm}, billing_state = ${code}, updated_at = NOW()
    WHERE id = ${uid}
  `

  await sql`
    INSERT INTO gst_configurations (
      user_id, gst_type, gst_number, business_name, business_address, city, state, pincode, gst_enabled
    )
    VALUES (
      ${uid},
      ${gstType},
      ${gstNumber || null},
      ${businessName || null},
      ${businessAddress || null},
      ${city || null},
      ${stateLabel || null},
      ${pincode || null},
      false
    )
    ON CONFLICT (user_id) DO UPDATE SET
      gst_type = EXCLUDED.gst_type,
      gst_number = EXCLUDED.gst_number,
      business_name = EXCLUDED.business_name,
      business_address = EXCLUDED.business_address,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      pincode = EXCLUDED.pincode,
      updated_at = NOW()
  `

  return jsonOk({ success: true })
})
