import { createHash, randomBytes } from "crypto"

export type CameraIngestGatewayConfig = {
  host: string
  sftpPort: number
  ftpPort: number
  ftpsPort: number
  preferredProtocol: "sftp" | "ftps" | "ftp"
}

export type CameraIngestCredential = {
  id: string
  label: string
  username: string
  uploadPrefix: string
  enabled: boolean
  expiresAt: string | null
  gatewayUserId: string | null
  lastUploadAt: string | null
  importedAssetCount: number
  createdAt: string | null
  updatedAt: string | null
}

const DEFAULT_PASSWORD_BYTES = 18

function parsePort(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10)
  return Number.isFinite(n) && n > 0 && n < 65536 ? n : fallback
}

function cleanSegment(value: string, fallback: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12)
  return cleaned || fallback
}

export function getCameraIngestGatewayConfig(): CameraIngestGatewayConfig {
  const preferred = (process.env.CLIENT_GALLERY_CAMERA_INGEST_PROTOCOL || "sftp").toLowerCase()
  return {
    host: process.env.CLIENT_GALLERY_CAMERA_INGEST_HOST || "",
    sftpPort: parsePort(process.env.CLIENT_GALLERY_CAMERA_INGEST_SFTP_PORT, 22),
    ftpPort: parsePort(process.env.CLIENT_GALLERY_CAMERA_INGEST_FTP_PORT, 21),
    ftpsPort: parsePort(process.env.CLIENT_GALLERY_CAMERA_INGEST_FTPS_PORT, 990),
    preferredProtocol: preferred === "ftp" || preferred === "ftps" ? preferred : "sftp",
  }
}

export function generateCameraIngestPassword(): string {
  return randomBytes(DEFAULT_PASSWORD_BYTES).toString("base64").replace(/[+/=]/g, "").slice(0, 22)
}

export function hashCameraIngestPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = createHash("sha256").update(`${salt}:${password}`).digest("hex")
  return `sha256$${salt}$${hash}`
}

export function generateCameraIngestUsername(userId: string, albumId: string): string {
  const userPart = cleanSegment(userId, "user")
  const albumPart = cleanSegment(albumId, "album")
  const suffix = randomBytes(4).toString("hex")
  return `cg_${userPart}_${albumPart}_${suffix}`.slice(0, 64)
}

export function normalizeCameraIngestLabel(value: unknown): string {
  if (typeof value !== "string") return "Camera upload"
  const label = value.trim().replace(/\s+/g, " ").slice(0, 80)
  return label || "Camera upload"
}

export function parseOptionalExpiry(value: unknown): string | null {
  if (value == null || value === "") return null
  if (typeof value !== "string") return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export function cameraIngestRowToApi(row: Record<string, unknown>): CameraIngestCredential {
  return {
    id: String(row.id),
    label: String(row.label ?? "Camera upload"),
    username: String(row.username ?? ""),
    uploadPrefix: String(row.upload_prefix ?? ""),
    enabled: row.enabled !== false,
    expiresAt: row.expires_at != null ? String(row.expires_at) : null,
    gatewayUserId: row.gateway_user_id != null ? String(row.gateway_user_id) : null,
    lastUploadAt: row.last_upload_at != null ? String(row.last_upload_at) : null,
    importedAssetCount: Number(row.imported_asset_count ?? 0),
    createdAt: row.created_at != null ? String(row.created_at) : null,
    updatedAt: row.updated_at != null ? String(row.updated_at) : null,
  }
}

