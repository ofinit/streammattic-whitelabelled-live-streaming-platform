import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

let cached: S3Client | null = null

export function isClientGalleryS3Configured(): boolean {
  return Boolean(
    process.env.CLIENT_GALLERY_S3_BUCKET?.trim() &&
      process.env.CLIENT_GALLERY_S3_REGION?.trim() &&
      process.env.CLIENT_GALLERY_S3_ACCESS_KEY_ID?.trim() &&
      process.env.CLIENT_GALLERY_S3_SECRET_ACCESS_KEY?.trim(),
  )
}

export function getClientGalleryBucket(): string {
  return process.env.CLIENT_GALLERY_S3_BUCKET?.trim() || ""
}

export function getClientGalleryS3Client(): S3Client {
  if (!isClientGalleryS3Configured()) {
    throw new Error("CLIENT_GALLERY_S3_* environment variables are not fully configured")
  }
  if (!cached) {
    const endpoint = process.env.CLIENT_GALLERY_S3_ENDPOINT?.trim()
    cached = new S3Client({
      region: process.env.CLIENT_GALLERY_S3_REGION!,
      endpoint: endpoint && endpoint.length > 0 ? endpoint : undefined,
      credentials: {
        accessKeyId: process.env.CLIENT_GALLERY_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLIENT_GALLERY_S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: process.env.CLIENT_GALLERY_S3_FORCE_PATH_STYLE === "true",
    })
  }
  return cached
}

export async function presignPutObject(key: string, contentType: string, expiresIn = 3600): Promise<string> {
  const client = getClientGalleryS3Client()
  const cmd = new PutObjectCommand({
    Bucket: getClientGalleryBucket(),
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(client, cmd, { expiresIn })
}

export async function presignGetObject(key: string, expiresIn = 3600): Promise<string> {
  const client = getClientGalleryS3Client()
  const cmd = new GetObjectCommand({
    Bucket: getClientGalleryBucket(),
    Key: key,
  })
  return getSignedUrl(client, cmd, { expiresIn })
}
