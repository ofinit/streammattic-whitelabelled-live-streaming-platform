const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
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

async function run() {
  // Check what tables exist
  const tables = await exec(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
  console.log("Existing tables:", JSON.stringify(tables.rows.map(r => r[0])));

  // Check what columns exist in the tables that had failures
  const ordersCols = await exec(`SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position`);
  console.log("Orders columns:", JSON.stringify(ordersCols.rows.map(r => r[0])));

  const notifCols = await exec(`SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications' ORDER BY ordinal_position`);
  console.log("Notifications columns:", JSON.stringify(notifCols.rows.map(r => r[0])));

  const refundCols = await exec(`SELECT column_name FROM information_schema.columns WHERE table_name = 'refund_requests' ORDER BY ordinal_position`);
  console.log("Refund_requests columns:", JSON.stringify(refundCols.rows.map(r => r[0])));

  const adjCols = await exec(`SELECT column_name FROM information_schema.columns WHERE table_name = 'wallet_adjustments' ORDER BY ordinal_position`);
  console.log("Wallet_adjustments columns:", JSON.stringify(adjCols.rows.map(r => r[0])));

  const invoiceCols = await exec(`SELECT column_name FROM information_schema.columns WHERE table_name = 'invoices' ORDER BY ordinal_position`);
  console.log("Invoices columns:", JSON.stringify(invoiceCols.rows.map(r => r[0])));

  const ytCols = await exec(`SELECT column_name FROM information_schema.columns WHERE table_name = 'youtube_channels' ORDER BY ordinal_position`);
  console.log("Youtube_channels columns:", JSON.stringify(ytCols.rows.map(r => r[0])));

  // Fix indexes with reserved words (quote them)
  const fixes = [
    `CREATE INDEX IF NOT EXISTS idx_orders_type ON orders("type")`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, "read")`,
  ];

  for (let i = 0; i < fixes.length; i++) {
    try {
      await exec(fixes[i]);
      console.log(`Fix ${i+1} OK`);
    } catch (e) {
      console.log(`Fix ${i+1} FAILED: ${e.message}`);
    }
  }
}

run().catch(e => console.error("Fatal:", e.message));
