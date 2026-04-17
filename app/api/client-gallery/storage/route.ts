import { jsonError, jsonOk, withAuth } from "@/lib/api-helpers"
import { isClientGalleryEntitled } from "@/lib/client-gallery-entitlement"
import {
  getPublicStorageSettingsForUser,
  getStorageConfigS3InvalidReason,
  upsertStorageSettings,
} from "@/lib/client-gallery-storage"

export const dynamic = "force-dynamic"

async function gateStreamerStudioEntitled(user: Record<string, unknown>): Promise<Response | null> {
  const role = user.role as string
  if (role !== "studio" && role !== "streamer") {
    return jsonError("Forbidden", 403)
  }
  const uid = String(user.id)
  const entitled = await isClientGalleryEntitled(uid, role)
  if (!entitled) {
    return jsonError("Photo gallery add-on is not enabled for your account", 403)
  }
  return null
}

export const GET = withAuth(async (user) => {
  const gate = await gateStreamerStudioEntitled(user)
  if (gate) return gate
  const settings = await getPublicStorageSettingsForUser(String(user.id))
  return jsonOk(settings)
})

export const PUT = withAuth(async (user, request: Request) => {
  const gate = await gateStreamerStudioEntitled(user)
  if (gate) return gate
  const uid = String(user.id)

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  const region = typeof body.region === "string" ? body.region : "auto"
  const bucket = typeof body.bucket === "string" ? body.bucket : ""
  const accessKeyId = typeof body.accessKeyId === "string" ? body.accessKeyId : ""
  let endpoint: string | null = null
  if (body.endpoint !== undefined && body.endpoint !== null) {
    endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() || null : null
  }
  const forcePathStyle = body.forcePathStyle === true
  const secretRaw = typeof body.secretAccessKey === "string" ? body.secretAccessKey : ""
  const secretAccessKey = secretRaw.trim().length > 0 ? secretRaw.trim() : null

  const existing = await getPublicStorageSettingsForUser(uid)
  const preserveSecret = existing.hasSecret && secretAccessKey === null

  if (!preserveSecret && !secretAccessKey) {
    return jsonError("Secret access key is required", 400)
  }
  if (!bucket.trim() || !accessKeyId.trim()) {
    return jsonError("Bucket and access key are required", 400)
  }

  const configInvalid = getStorageConfigS3InvalidReason({ endpoint, region })
  if (configInvalid) {
    return jsonError(configInvalid, 400)
  }

  try {
    await upsertStorageSettings({
      userId: uid,
      endpoint,
      region,
      bucket,
      accessKeyId,
      secretAccessKey,
      preserveSecret,
      forcePathStyle,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not save settings"
    return jsonError(msg, 400)
  }

  const settings = await getPublicStorageSettingsForUser(uid)
  return jsonOk(settings)
})
