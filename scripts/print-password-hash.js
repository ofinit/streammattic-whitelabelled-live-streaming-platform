/**
 * Print a PBKDF2 password hash compatible with lib/auth.ts (for manual SQL updates).
 * Use when Node is not available on the server but you have psql (e.g. DB container).
 *
 * Usage (on any machine with Node 18+):
 *   node scripts/print-password-hash.js "YourNewPassword"
 *
 * Then in psql:
 *   UPDATE users SET password_hash = '<paste hash>', updated_at = NOW()
 *   WHERE LOWER(TRIM(email)) = 'ofinitsolutions@gmail.com';
 */
/* eslint-disable no-console */
const { webcrypto } = require("node:crypto")

async function hashPassword(password) {
  const encoder = new TextEncoder()
  const salt = webcrypto.getRandomValues(new Uint8Array(16))
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("")
  const keyMaterial = await webcrypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const derivedBits = await webcrypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256,
  )
  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return `pbkdf2:100000:${saltHex}:${hashHex}`
}

async function main() {
  const pwd = process.argv[2]
  if (!pwd) {
    console.error('Usage: node scripts/print-password-hash.js "YourPassword"')
    process.exit(1)
  }
  const hash = await hashPassword(pwd)
  console.log(hash)
  console.log("")
  console.log("-- Example (replace email if needed):")
  console.log(
    `UPDATE users SET password_hash = '${hash.replace(/'/g, "''")}', updated_at = NOW() WHERE LOWER(TRIM(email)) = 'ofinitsolutions@gmail.com';`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
