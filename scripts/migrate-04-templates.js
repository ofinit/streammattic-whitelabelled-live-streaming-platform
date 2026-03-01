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
  // Check event_templates columns
  const cols = await exec("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'event_templates' ORDER BY ordinal_position");
  console.log("event_templates columns:", JSON.stringify(cols.rows, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
