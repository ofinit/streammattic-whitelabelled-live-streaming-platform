const { Client } = require("pg")
const { webcrypto } = require("node:crypto")
require("dotenv").config({ path: ".env.local" })

const EMAIL = "pbollapragada@gmail.com"
const PASSWORD = "eLive$777#1%"
const ROLE = "admin"

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
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is missing")
    process.exit(1)
  }

  const client = new Client({ connectionString })
  await client.connect()
  console.log("Connected to database")

  const passwordHash = await hashPassword(PASSWORD)

  const check = await client.query("SELECT id, email, role FROM users WHERE lower(email) = lower($1)", [EMAIL])

  if (check.rows.length > 0) {
    const existing = check.rows[0]
    console.log("User exists:", existing)
    await client.query(
      `UPDATE users 
       SET password_hash = $1, role = $2, status = 'active', updated_at = NOW() 
       WHERE id = $3`,
      [passwordHash, ROLE, existing.id]
    )
    console.log(`Successfully updated ${EMAIL} with role=${ROLE} and new password.`)
  } else {
    console.log("Creating new user...")
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())`,
      ["P Bollapragada", EMAIL, passwordHash, ROLE]
    )
    console.log(`Successfully created ${EMAIL} with role=${ROLE}.`)
  }

  await client.end()
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
