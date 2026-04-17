import { HeadBucketCommand, type S3Client } from "@aws-sdk/client-s3"
import { jsonError, jsonOk, withAuth } from "@/lib/api-helpers"
import { isClientGalleryEntitled } from "@/lib/client-gallery-entitlement"
import { getDecryptedStorageForUser, StorageConfigError } from "@/lib/client-gallery-storage"
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

  let client: S3Client
  try {
    client = createS3ClientFromConfig(config)
  } catch (e) {
    if (e instanceof StorageConfigError) {
      return jsonError(e.message, 400)
    }
    throw e
  }
  try {
    await client.send(new HeadBucketCommand({ Bucket: config.bucket }))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[client-gallery storage test]", e)
    let detail = `Connection failed: ${msg}`
    const noEndpoint = !config.endpoint || String(config.endpoint).trim() === ""
    const looksUnknown = /unknown/i.test(msg) || msg === ""
    if (noEndpoint && looksUnknown) {
      detail +=
        " With an empty Endpoint, the app talks to AWS S3 only. For Wasabi, set Endpoint to your region URL (e.g. https://s3.ap-southeast-1.wasabisys.com for region ap-southeast-1), then Save and test again."
    }
    return jsonError(detail, 502)
  }

  return jsonOk({ ok: true })
})
