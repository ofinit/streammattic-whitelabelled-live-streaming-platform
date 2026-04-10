/**
 * One-time (or repeat-safe) production bootstrap:
 * - Deletes legacy demo accounts and template-seeded mock events
 * - Upserts platform admin with pbkdf2 password hash (matches lib/auth.ts verifyPassword)
 *
 * Usage (needs Node — run on your PC or the **app** container, not the Postgres container):
 *   DATABASE_URL=... node scripts/seed-production-admin.js
 *   node --env-file=.env.production scripts/seed-production-admin.js
 *
 * If `node` is not installed (e.g. only `psql` in the DB shell), generate a hash with:
 *   node scripts/print-password-hash.js "YourPassword"
 *   then run the printed UPDATE in psql.
 *
 * Optional overrides:
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
 */
/* eslint-disable no-console */
const { Client } = require("pg")
const { webcrypto } = require("node:crypto")

const DEMO_EMAILS = [
  "admin@streammattic.com",
  "admin@streamlivee.com",
  "alice@example.com",
  "john@livestream.pro",
  /** Legacy seed admin email (same row as fixed UUID …0001 in some DBs) */
  "johnson@ofinit.com",
]

const DEFAULT_ADMIN_EMAIL = "ofinitsolutions@gmail.com"
const DEFAULT_ADMIN_PASSWORD = "Html@1234"

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

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase().trim()
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD
  const adminName = process.env.SEED_ADMIN_NAME || "Platform Admin"

  const client = new Client({ connectionString: url })
  await client.connect()

  try {
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

    const passwordHash = await hashPassword(adminPassword)
    const upsert = await client.query(
      `INSERT INTO users (email, name, password_hash, role, status, email_verified)
       VALUES ($1, $2, $3, 'admin', 'active', true)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         name = EXCLUDED.name,
         role = 'admin',
         status = 'active',
         email_verified = true,
         updated_at = NOW()
       RETURNING id`,
      [adminEmail, adminName, passwordHash],
    )
    const userId = upsert.rows[0].id
    console.log(`Admin upserted: ${adminEmail} (${userId})`)

    await client.query(
      `INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0, 'INR') ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    )
    await client.query(`INSERT INTO user_credits (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [userId])

    console.log("Done. Sign in with the admin email and password (rotate password after first login).")
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
