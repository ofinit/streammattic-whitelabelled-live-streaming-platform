import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set. Generate one: openssl rand -hex 32")
  }
  if (key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate one: openssl rand -hex 32")
  }
  return Buffer.from(key, "hex")
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a string in format: iv:authTag:ciphertext (all hex encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, "utf8", "hex")
  encrypted += cipher.final("hex")
  const authTag = cipher.getAuthTag()

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`
}

/**
 * Decrypt a string encrypted by the encrypt() function.
 * Expects format: iv:authTag:ciphertext (all hex encoded)
 */
export function decrypt(encryptedString: string): string {
  const key = getEncryptionKey()
  const parts = encryptedString.split(":")

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted string format. Expected iv:authTag:ciphertext")
  }

  const [ivHex, authTagHex, ciphertext] = parts
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: ${iv.length}, expected ${IV_LENGTH}`)
  }
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(`Invalid auth tag length: ${authTag.length}, expected ${AUTH_TAG_LENGTH}`)
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}
