const { Client } = require("pg");
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const tables = ["refund_requests", "wallet_adjustments", "invoices", "youtube_channels"];
  for (const t of tables) {
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position", [t]);
    console.log(t + ":", JSON.stringify(res.rows.map(r => r.column_name)));
  }
  await client.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
