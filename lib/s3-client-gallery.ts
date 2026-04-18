import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
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

export async function deleteObjectForOwner(ownerUserId: string, key: string): Promise<void> {
  const config = await getDecryptedStorageForUser(ownerUserId)
  if (!config) {
    throw new Error("Storage not configured")
  }
  const client = createS3ClientFromConfig(config)
  await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }))
}

/** Deletes all objects whose keys start with `prefix` (album s3_prefix, e.g. cg/user/slug-uuid/). */
export async function deleteAllObjectsUnderPrefixForOwner(ownerUserId: string, prefix: string): Promise<void> {
  const config = await getDecryptedStorageForUser(ownerUserId)
  if (!config) {
    throw new Error("Storage not configured")
  }
  const client = createS3ClientFromConfig(config)
  const bucket = config.bucket
  let continuationToken: string | undefined
  do {
    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    )
    const keys = (list.Contents ?? []).map((o) => o.Key).filter((k): k is string => Boolean(k))
    if (keys.length > 0) {
      for (let i = 0; i < keys.length; i += 1000) {
        const batch = keys.slice(i, i + 1000)
        await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
          }),
        )
      }
    }
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined
  } while (continuationToken)
}
