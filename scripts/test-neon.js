const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("No DATABASE_URL"); process.exit(1); }

const url = new URL(DATABASE_URL.replace("postgres://", "https://").replace("postgresql://", "https://"));
const API_URL = `https://${url.hostname}/sql`;

console.log("API_URL:", API_URL);
console.log("DATABASE_URL starts with:", DATABASE_URL.substring(0, 30));

async function execSql(query) {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": DATABASE_URL,
    },
    body: JSON.stringify({ query, params: [] }),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text.substring(0, 200)}`);
  return JSON.parse(text);
}

async function run() {
  console.log("Testing connection...");
  const r = await execSql("SELECT current_database(), current_schema()");
  console.log("Result:", JSON.stringify(r));

  console.log("Testing ENUM create...");
  try {
    await execSql("CREATE TYPE test_enum_123 AS ENUM ('a', 'b')");
    console.log("ENUM created!");
  } catch (e) {
    console.log("ENUM err:", e.message.substring(0, 100));
  }

  // Clean up
  try { await execSql("DROP TYPE IF EXISTS test_enum_123"); } catch(e) {}
  console.log("Test complete!");
}

run().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
