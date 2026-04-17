import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import {
  type DecryptedStorageConfig,
  getDecryptedStorageForUser,
  getStorageConfigS3InvalidReason,
  StorageConfigError,
} from "@/lib/client-gallery-storage"

export function createS3ClientFromConfig(config: DecryptedStorageConfig): S3Client {
  const invalid = getStorageConfigS3InvalidReason(config)
  if (invalid) {
    throw new StorageConfigError(invalid)
  }
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint ?? undefined,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle,
  })
}

/**
 * Presigned PUT for an object key using the album owner's saved S3 credentials (BYOS — no platform env fallback).
 */
export async function presignPutObjectForOwner(
  ownerUserId: string,
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const config = await getDecryptedStorageForUser(ownerUserId)
  if (!config) {
    throw new Error("Storage not configured")
  }
  const client = createS3ClientFromConfig(config)
  const cmd = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(client, cmd, { expiresIn })
}

/**
 * Presigned GET for guest / owner previews using the album owner's credentials.
 */
export async function presignGetObjectForOwner(
  ownerUserId: string,
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const config = await getDecryptedStorageForUser(ownerUserId)
  if (!config) {
    throw new Error("Storage not configured")
  }
  const client = createS3ClientFromConfig(config)
  const cmd = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  })
  return getSignedUrl(client, cmd, { expiresIn })
}
