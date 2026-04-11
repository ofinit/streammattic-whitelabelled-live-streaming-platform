const { Client } = require("pg");
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

// PBKDF2 password hash using Web Crypto
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");

  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:100000:${saltHex}:${hashHex}`;
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  // Hash admin password
  const adminPassword = "admin123"; // Default admin password - change in production!
  const hash = await hashPassword(adminPassword);
  console.log("Generated hash for admin:", hash.substring(0, 30) + "...");

  // Update legacy seed admin (002-seed.sql uses admin@streammattic.com)
  await client.query(
    "UPDATE users SET password_hash = $1 WHERE email = 'admin@streammattic.com'",
    [hash]
  );
  console.log("Admin password updated successfully");

  // Verify
  const result = await client.query("SELECT id, email, name, role, status, password_hash FROM users WHERE email = 'admin@streammattic.com'");
  const admin = result.rows[0];
  if (admin) {
    console.log("Admin user:", admin.email, admin.role, admin.status);
    console.log("Password hash starts with:", admin.password_hash.substring(0, 20));
  } else {
    console.log("No user with email admin@streammattic.com found.");
  }
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
