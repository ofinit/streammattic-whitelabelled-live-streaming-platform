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

async function main() {
  const tables = ["refund_requests", "wallet_adjustments", "invoices", "youtube_channels"];
  for (const t of tables) {
    const res = await exec("SELECT column_name FROM information_schema.columns WHERE table_name='" + t + "' ORDER BY ordinal_position");
    console.log(t + ":", JSON.stringify(res.rows.map(r => r.column_name)));
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
