import { getDb } from "@/lib/db"
import { decrypt, encrypt } from "@/lib/encryption"

/** Decrypted credentials for S3-compatible API calls (never send to client). */
export type DecryptedStorageConfig = {
  endpoint: string | null
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  forcePathStyle: boolean
}

/** Safe fields for GET /api/client-gallery/storage (secret never returned; access key id shown for editing). */
export type PublicStorageSettings = {
  configured: boolean
  endpoint: string | null
  region: string
  bucket: string
  /** Full access key id for form prefill (not the secret). */
  accessKeyId: string
  accessKeyIdMasked: string
  hasSecret: boolean
  forcePathStyle: boolean
  updatedAt: string | null
}

export function maskAccessKeyId(id: string): string {
  const t = id.trim()
  if (t.length <= 4) return "****"
  return `…${t.slice(-4)}`
}

export async function getDecryptedStorageForUser(userId: string): Promise<DecryptedStorageConfig | null> {
  const sql = getDb()
  let rows: Record<string, unknown>[]
  try {
    rows = await sql`
      SELECT s3_endpoint, s3_region, s3_bucket, s3_access_key_id, s3_secret_access_key_encrypted, s3_force_path_style
      FROM client_gallery_storage_settings
      WHERE user_id = ${userId}
      LIMIT 1
    `
  } catch {
    return null
  }
  const r = rows[0]
  if (!r) return null
  const enc = r.s3_secret_access_key_encrypted
  if (enc == null || String(enc).length === 0) return null
  const secret = decrypt(String(enc))
  if (!secret || secret.length === 0) return null
  const bucket = String(r.s3_bucket ?? "").trim()
  const accessKeyId = String(r.s3_access_key_id ?? "").trim()
  if (!bucket || !accessKeyId) return null
  const ep = r.s3_endpoint
  return {
    endpoint: ep != null && String(ep).trim() !== "" ? String(ep).trim() : null,
    region: (String(r.s3_region ?? "auto").trim() || "auto"),
    bucket,
    accessKeyId,
    secretAccessKey: secret,
    forcePathStyle: r.s3_force_path_style === true,
  }
}

export async function isStorageConfiguredForUser(userId: string): Promise<boolean> {
  const c = await getDecryptedStorageForUser(userId)
  return c != null
}

export async function getPublicStorageSettingsForUser(userId: string): Promise<PublicStorageSettings> {
  const sql = getDb()
  let rows: Record<string, unknown>[]
  try {
    rows = await sql`
      SELECT s3_endpoint, s3_region, s3_bucket, s3_access_key_id, s3_secret_access_key_encrypted, s3_force_path_style, updated_at
      FROM client_gallery_storage_settings
      WHERE user_id = ${userId}
      LIMIT 1
    `
  } catch {
    return {
      configured: false,
      endpoint: null,
      region: "auto",
      bucket: "",
      accessKeyId: "",
      accessKeyIdMasked: "",
      hasSecret: false,
      forcePathStyle: false,
      updatedAt: null,
    }
  }
  const r = rows[0]
  if (!r) {
    return {
      configured: false,
      endpoint: null,
      region: "auto",
      bucket: "",
      accessKeyId: "",
      accessKeyIdMasked: "",
      hasSecret: false,
      forcePathStyle: false,
      updatedAt: null,
    }
  }
  const ak = String(r.s3_access_key_id ?? "").trim()
  const hasSecret =
    r.s3_secret_access_key_encrypted != null && String(r.s3_secret_access_key_encrypted).length > 0
  const ep = r.s3_endpoint
  return {
    configured: hasSecret && ak.length > 0 && String(r.s3_bucket ?? "").trim().length > 0,
    endpoint: ep != null && String(ep).trim() !== "" ? String(ep).trim() : null,
    region: String(r.s3_region ?? "auto").trim() || "auto",
    bucket: String(r.s3_bucket ?? "").trim(),
    accessKeyId: ak,
    accessKeyIdMasked: ak ? maskAccessKeyId(ak) : "",
    hasSecret,
    forcePathStyle: r.s3_force_path_style === true,
    updatedAt: r.updated_at != null ? String(r.updated_at) : null,
  }
}

export async function upsertStorageSettings(args: {
  userId: string
  endpoint: string | null
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string | null
  /** When true and secretAccessKey is null, keep existing encrypted secret */
  preserveSecret: boolean
  forcePathStyle: boolean
}): Promise<void> {
  const sql = getDb()
  const region = args.region.trim() || "auto"
  const bucket = args.bucket.trim()
  const accessKeyId = args.accessKeyId.trim()

  let encryptedSecret: string | null = null
  if (args.secretAccessKey != null && args.secretAccessKey.trim().length > 0) {
    encryptedSecret = encrypt(args.secretAccessKey.trim())
  } else if (args.preserveSecret) {
    const existing = await sql`
      SELECT s3_secret_access_key_encrypted FROM client_gallery_storage_settings WHERE user_id = ${args.userId} LIMIT 1
    `
    const row = existing[0] as { s3_secret_access_key_encrypted?: string } | undefined
    encryptedSecret = row?.s3_secret_access_key_encrypted ?? null
  }

  if (!encryptedSecret) {
    throw new Error("Secret access key is required")
  }
  if (!bucket || !accessKeyId) {
    throw new Error("Bucket and access key id are required")
  }

  const endpointSql = args.endpoint != null && args.endpoint.trim() !== "" ? args.endpoint.trim() : null

  await sql`
    INSERT INTO client_gallery_storage_settings (
      user_id, s3_endpoint, s3_region, s3_bucket, s3_access_key_id, s3_secret_access_key_encrypted, s3_force_path_style, updated_at
    )
    VALUES (
      ${args.userId},
      ${endpointSql},
      ${region},
      ${bucket},
      ${accessKeyId},
      ${encryptedSecret},
      ${args.forcePathStyle},
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      s3_endpoint = ${endpointSql},
      s3_region = ${region},
      s3_bucket = ${bucket},
      s3_access_key_id = ${accessKeyId},
      s3_secret_access_key_encrypted = ${encryptedSecret},
      s3_force_path_style = ${args.forcePathStyle},
      updated_at = NOW()
  `
}
