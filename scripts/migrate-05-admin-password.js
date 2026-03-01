const DATABASE_URL = process.env.DATABASE_URL;
const API_URL = `https://${new URL(DATABASE_URL.replace("postgres://","https://").replace("postgresql://","https://")).hostname}/sql`;
async function exec(query) {
  const r = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Neon-Connection-String": DATABASE_URL },
    body: JSON.stringify({ query, params: [] }),
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`HTTP ${r.status}: ${t.substring(0,300)}`); }
  return r.json();
}

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
  // Hash admin password
  const adminPassword = "admin123"; // Default admin password - change in production!
  const hash = await hashPassword(adminPassword);
  console.log("Generated hash for admin:", hash.substring(0, 30) + "...");

  // Update admin user
  await exec(`UPDATE users SET password_hash = '${hash}' WHERE email = 'admin@streammattic.com'`);
  console.log("Admin password updated successfully");

  // Verify
  const result = await exec("SELECT id, email, name, role, status, password_hash FROM users WHERE email = 'admin@streammattic.com'");
  const admin = result.rows[0];
  console.log("Admin user:", admin.email, admin.role, admin.status);
  console.log("Password hash starts with:", admin.password_hash.substring(0, 20));
}

main().catch(e => { console.error(e); process.exit(1); });
