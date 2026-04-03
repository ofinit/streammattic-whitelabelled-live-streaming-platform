/**
 * Fix admin password: Production DB has bcrypt hash but app expects PBKDF2.
 * Run: node --env-file=.env.local scripts/db-fix-admin-password.js
 */
const { Client } = require("pg");
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set. Run with: node --env-file=.env.local scripts/db-fix-admin-password.js");
  process.exit(1);
}

// PBKDF2 hash (matches lib/auth.ts hashPassword)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `pbkdf2:100000:${saltHex}:${hashHex}`;
}

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const password = "Admin@123"; // Matches documentation
  console.log("Updating admin password to PBKDF2 format...");
  const hash = await hashPassword(password);

  await client.query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email IN ($2, $3)`,
    [hash, "admin@streamlivee.com", "admin@streammattic.com"]
  );

  console.log("Done. You can now login with:");
  console.log("  Email: admin@streamlivee.com");
  console.log("  Password: Admin@123");
  await client.end();
}

run().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
