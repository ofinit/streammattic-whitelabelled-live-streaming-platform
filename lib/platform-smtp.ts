import { decrypt, encrypt } from "@/lib/encryption"

export const PLATFORM_SMTP_SETTING_KEY = "platform_smtp_config"

export type PlatformSmtpStoredConfig = {
  enabled?: boolean
  host?: string
  port?: number
  user?: string
  passwordEncrypted?: string | null
  fromEmail?: string
  fromName?: string
  secure?: boolean
  requireTls?: boolean
}

export type PlatformSmtpPublicConfig = {
  enabled: boolean
  host: string
  port: number
  user: string
  fromEmail: string
  fromName: string
  secure: boolean
  requireTls: boolean
  hasPassword: boolean
}

export type PlatformSmtpRuntimeConfig = PlatformSmtpPublicConfig & {
  password: string
}

const DEFAULT_PLATFORM_SMTP_CONFIG: PlatformSmtpPublicConfig = {
  enabled: false,
  host: "",
  port: 587,
  user: "",
  fromEmail: "",
  fromName: "",
  secure: false,
  requireTls: true,
  hasPassword: false,
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function port(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 587
  return Math.min(65535, Math.floor(parsed))
}

export function parsePlatformSmtpStoredConfig(raw: unknown): PlatformSmtpStoredConfig {
  const record = asRecord(raw)
  return {
    enabled: record.enabled === true,
    host: str(record.host),
    port: port(record.port),
    user: str(record.user),
    passwordEncrypted: str(record.passwordEncrypted) || null,
    fromEmail: str(record.fromEmail),
    fromName: str(record.fromName),
    secure: record.secure === true,
    requireTls: record.requireTls !== false,
  }
}

export function toPlatformSmtpPublicConfig(raw: unknown): PlatformSmtpPublicConfig {
  const parsed = parsePlatformSmtpStoredConfig(raw)
  return {
    ...DEFAULT_PLATFORM_SMTP_CONFIG,
    enabled: parsed.enabled === true,
    host: parsed.host || "",
    port: parsed.port || 587,
    user: parsed.user || "",
    fromEmail: parsed.fromEmail || "",
    fromName: parsed.fromName || "",
    secure: parsed.secure === true,
    requireTls: parsed.requireTls !== false,
    hasPassword: !!parsed.passwordEncrypted,
  }
}

export function toPlatformSmtpRuntimeConfig(raw: unknown): PlatformSmtpRuntimeConfig | null {
  const parsed = parsePlatformSmtpStoredConfig(raw)
  const password = decrypt(parsed.passwordEncrypted || null) || ""
  if (!parsed.enabled || !parsed.host || !parsed.user || !password) return null
  return {
    enabled: true,
    host: parsed.host,
    port: parsed.port || 587,
    user: parsed.user,
    password,
    fromEmail: parsed.fromEmail || "",
    fromName: parsed.fromName || "",
    secure: parsed.secure === true,
    requireTls: parsed.requireTls !== false,
    hasPassword: true,
  }
}

export function buildPlatformSmtpStoredConfig(
  incoming: Record<string, unknown>,
  previousRaw: unknown,
): PlatformSmtpStoredConfig {
  const previous = parsePlatformSmtpStoredConfig(previousRaw)
  const password = str(incoming.password)
  const clearPassword = incoming.clearPassword === true
  return {
    enabled: incoming.enabled === true,
    host: str(incoming.host),
    port: port(incoming.port),
    user: str(incoming.user),
    passwordEncrypted: clearPassword ? null : password ? encrypt(password) : previous.passwordEncrypted || null,
    fromEmail: str(incoming.fromEmail),
    fromName: str(incoming.fromName),
    secure: incoming.secure === true,
    requireTls: incoming.requireTls !== false,
  }
}

export function validatePlatformSmtpConfig(config: PlatformSmtpStoredConfig): string | null {
  if (!config.enabled) return null
  if (!config.host?.trim()) return "SMTP host is required when SMTP is enabled."
  if (!config.user?.trim()) return "SMTP user is required when SMTP is enabled."
  if (!config.passwordEncrypted) return "SMTP password is required when SMTP is enabled."
  if (!config.fromEmail?.trim()) return "From email is required when SMTP is enabled."
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.fromEmail.trim())) {
    return "From email must be a valid email address."
  }
  return null
}

