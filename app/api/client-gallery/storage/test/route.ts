import { HeadBucketCommand } from "@aws-sdk/client-s3"
import { jsonError, jsonOk, withAuth } from "@/lib/api-helpers"
import { isClientGalleryEntitled } from "@/lib/client-gallery-entitlement"
import { getDecryptedStorageForUser } from "@/lib/client-gallery-storage"
import { createS3ClientFromConfig } from "@/lib/s3-client-gallery"

export const dynamic = "force-dynamic"

export const POST = withAuth(async (user) => {
  const role = user.role as string
  if (role !== "studio" && role !== "streamer") {
    return jsonError("Forbidden", 403)
  }
  const uid = String(user.id)
  const entitled = await isClientGalleryEntitled(uid, role)
  if (!entitled) {
    return jsonError("Photo gallery add-on is not enabled for your account", 403)
  }

  const config = await getDecryptedStorageForUser(uid)
  if (!config) {
    return jsonError("Save storage settings first, then test the connection.", 400)
  }

  const client = createS3ClientFromConfig(config)
  try {
    await client.send(new HeadBucketCommand({ Bucket: config.bucket }))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[client-gallery storage test]", e)
    return jsonError(`Connection failed: ${msg}`, 502)
  }

  return jsonOk({ ok: true })
})
