/**
 * One-time (or repeat-safe) production bootstrap:
 * - Ensures user_role ENUM values ('rtmp_operator', 'elive_operator') exist
 * - Upserts platform super admin (ofinitsolutions@gmail.com) with full admin role
 * - Upserts eLive operator admin (pbollapragada@gmail.com) with elive_operator role
 */
/* eslint-disable no-console */
const { Client } = require("pg")
const { webcrypto } = require("node:crypto")

const DEMO_EMAILS = [
  "admin@streammattic.com",
  "admin@streamlivee.com",
  "alice@example.com",
  "john@livestream.pro",
  "johnson@ofinit.com",
]

const ADMIN_ACCOUNTS = [
  {
    email: process.env.PRIMARY_ADMIN_EMAIL || "ofinitsolutions@gmail.com",
    password: process.env.PRIMARY_ADMIN_PASSWORD || "Html@1234",
    name: "Platform Admin",
    role: "admin",
  },
  {
    email: process.env.OPERATOR_ADMIN_EMAIL || "pbollapragada@gmail.com",
    password: process.env.OPERATOR_ADMIN_PASSWORD || "eLive$777#1%",
    name: "eLive Operator",
    role: "elive_operator",
  },
]

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
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error("DATABASE_URL is required")
    process.exit(1)
  }

  const client = new Client({ connectionString: url })
  await client.connect()

  try {
    // 1. Ensure user_role ENUM values exist in Postgres
    await client.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'rtmp_operator'`).catch(() => {})
    await client.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'elive_operator'`).catch(() => {})

    await client.query(
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT false`,
    )
    const delMock = await client.query(`DELETE FROM events WHERE is_mock = true RETURNING id`)
    console.log(`Removed ${delMock.rowCount} mock template events (is_mock).`)

    const delUsers = await client.query(
      `DELETE FROM users WHERE lower(email) = ANY($1::text[]) RETURNING email`,
      [DEMO_EMAILS.map((e) => e.toLowerCase())],
    )
    console.log(`Removed ${delUsers.rowCount} demo user(s):`, delUsers.rows.map((r) => r.email).join(", ") || "(none)")

    for (const acc of ADMIN_ACCOUNTS) {
      const email = acc.email.toLowerCase().trim()
      const passwordHash = await hashPassword(acc.password)

      const upsert = await client.query(
        `INSERT INTO users (email, name, password_hash, role, status, email_verified)
         VALUES ($1, $2, $3, $4::user_role, 'active', true)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           status = 'active',
           email_verified = true,
           updated_at = NOW()
         RETURNING id`,
        [email, acc.name, passwordHash, acc.role],
      )
      const userId = upsert.rows[0].id
      console.log(`Admin user upserted: ${email} (${acc.role}) -> ID: ${userId}`)

      await client.query(
        `INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0, 'INR') ON CONFLICT (user_id) DO NOTHING`,
        [userId],
      )
      await client.query(`INSERT INTO user_credits (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [userId])
    }

    console.log("Done. Sign in with the admin email and password.")
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
