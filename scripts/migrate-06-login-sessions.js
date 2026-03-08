/**
 * Creates login_sessions table for magic link cross-device handshake.
 * Run: node scripts/migrate-06-login-sessions.js
 */
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set")
  process.exit(1)
}

const { neon } = require("@neondatabase/serverless")
const sql = neon(DATABASE_URL)

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS login_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_login_sessions_email ON login_sessions(email)`
  await sql`CREATE INDEX IF NOT EXISTS idx_login_sessions_status ON login_sessions(status)`
  await sql`CREATE INDEX IF NOT EXISTS idx_login_sessions_expires_at ON login_sessions(expires_at)`
  console.log("login_sessions table ready")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
