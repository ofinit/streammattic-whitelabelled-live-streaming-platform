const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("No DATABASE_URL"); process.exit(1); }

const { Client } = require("pg");

async function run() {
  console.log("Testing Postgres connection...");
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const r = await client.query("SELECT current_database(), current_schema()");
  console.log("Result:", r.rows?.[0]);

  console.log("Testing ENUM create...");
  try {
    await client.query("CREATE TYPE test_enum_123 AS ENUM ('a', 'b')");
    console.log("ENUM created!");
  } catch (e) {
    console.log("ENUM err:", e.message.substring(0, 100));
  }

  try { await client.query("DROP TYPE IF EXISTS test_enum_123"); } catch (e) {}
  await client.end();
  console.log("Test complete!");
}

run().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
