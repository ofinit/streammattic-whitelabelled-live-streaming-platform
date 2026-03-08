/**
 * Fix admin password: Production DB has bcrypt hash but app expects PBKDF2.
 * Run: node --env-file=.env.local scripts/db-fix-admin-password.js
 */
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set. Run with: node --env-file=.env.local scripts/db-fix-admin-password.js");
  process.exit(1);
}

const url = new URL(DATABASE_URL.replace("postgres://", "https://").replace("postgresql://", "https://"));
const API_URL = `https://${url.hostname}/sql`;

async function sql(query, params = []) {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": DATABASE_URL,
    },
    body: JSON.stringify({ query, params }),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text.substring(0, 300)}`);
  return JSON.parse(text);
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
  const password = "Admin@123"; // Matches documentation
  console.log("Updating admin password to PBKDF2 format...");
  const hash = await hashPassword(password);

  await sql(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = 'admin@streammattic.com'`,
    [hash]
  );

  console.log("Done. You can now login with:");
  console.log("  Email: admin@streammattic.com");
  console.log("  Password: Admin@123");
}

run().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
