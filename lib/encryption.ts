import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto"

const ALGORITHM = "aes-256-gcm"
// Use a 32-byte key derived from ENCRYPTION_SECRET env var
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || "sm-default-enc-secret-1234567890123456"
const KEY = scryptSync(ENCRYPTION_SECRET, "salt", 32)

/**
 * Encrypts a string using AES-256-GCM.
 * Format: iv:authTag:encryptedText
 */
export function encrypt(text: string | null | undefined): string | null {
  if (!text) return null
  try {
    const iv = randomBytes(12)
    const cipher = createCipheriv(ALGORITHM, KEY, iv)
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")
    const authTag = cipher.getAuthTag().toString("hex")
    return `${iv.toString("hex")}:${authTag}:${encrypted}`
  } catch (error) {
    console.error("Encryption failed:", error)
    return text // Fallback to plain text on error (not ideal, but safer for migration)
  }
}

/**
 * Decrypts a string encrypted with the logic above.
 */
export function decrypt(hash: string | null | undefined): string | null {
  if (!hash) return null
  const parts = hash.split(":")
  if (parts.length !== 3) return hash // Not an encrypted string or legacy format

  try {
    const [ivHex, authTagHex, encryptedText] = parts
    const iv = Buffer.from(ivHex, "hex")
    const authTag = Buffer.from(authTagHex, "hex")
    const decipher = createDecipheriv(ALGORITHM, KEY, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encryptedText, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  } catch (error) {
    console.error("Decryption failed:", error)
    return hash // Fallback to original
  }
}

/**
 * Legacy initializer for encryption keys. Now a no-op as we use ENCRYPTION_SECRET from environment.
 */
export async function initEncryptionKeyFromDb(): Promise<void> {
  return Promise.resolve()
}
