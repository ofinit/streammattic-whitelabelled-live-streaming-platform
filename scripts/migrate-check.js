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
  // Check tables
  const tables = await exec("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log("Tables:", tables.rows.map(r => r[0]));

  // Check orders columns
  const ordCols = await exec("SELECT column_name FROM information_schema.columns WHERE table_name='orders' ORDER BY ordinal_position");
  console.log("Orders columns:", ordCols.rows.map(r => r[0]));

  // Check notifications columns  
  const notCols = await exec("SELECT column_name FROM information_schema.columns WHERE table_name='notifications' ORDER BY ordinal_position");
  console.log("Notifications columns:", notCols.rows.map(r => r[0]));

  // Check existing indexes
  const idxs = await exec("SELECT indexname FROM pg_indexes WHERE schemaname='public' ORDER BY indexname");
  console.log("Existing indexes:", idxs.rows.map(r => r[0]));
}

main().catch(e => console.error(e));
