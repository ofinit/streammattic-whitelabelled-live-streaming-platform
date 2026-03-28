const { Client } = require("pg");
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

async function exec(client, query) {
  const r = await client.query(query);
  return { rows: r.rows };
}

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  // Check what tables exist
  const tables = await exec(client, `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
  console.log("Existing tables:", JSON.stringify(tables.rows.map(r => r[0])));

  // Check what columns exist in the tables that had failures
  const ordersCols = await exec(client, `SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position`);
  console.log("Orders columns:", JSON.stringify(ordersCols.rows.map(r => r[0])));

  const notifCols = await exec(client, `SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications' ORDER BY ordinal_position`);
  console.log("Notifications columns:", JSON.stringify(notifCols.rows.map(r => r[0])));

  const refundCols = await exec(client, `SELECT column_name FROM information_schema.columns WHERE table_name = 'refund_requests' ORDER BY ordinal_position`);
  console.log("Refund_requests columns:", JSON.stringify(refundCols.rows.map(r => r[0])));

  const adjCols = await exec(client, `SELECT column_name FROM information_schema.columns WHERE table_name = 'wallet_adjustments' ORDER BY ordinal_position`);
  console.log("Wallet_adjustments columns:", JSON.stringify(adjCols.rows.map(r => r[0])));

  const invoiceCols = await exec(client, `SELECT column_name FROM information_schema.columns WHERE table_name = 'invoices' ORDER BY ordinal_position`);
  console.log("Invoices columns:", JSON.stringify(invoiceCols.rows.map(r => r[0])));

  const ytCols = await exec(client, `SELECT column_name FROM information_schema.columns WHERE table_name = 'youtube_channels' ORDER BY ordinal_position`);
  console.log("Youtube_channels columns:", JSON.stringify(ytCols.rows.map(r => r[0])));

  // Fix indexes with reserved words (quote them)
  const fixes = [
    `CREATE INDEX IF NOT EXISTS idx_orders_type ON orders("type")`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, "read")`,
  ];

  for (let i = 0; i < fixes.length; i++) {
    try {
      await exec(client, fixes[i]);
      console.log(`Fix ${i+1} OK`);
    } catch (e) {
      console.log(`Fix ${i+1} FAILED: ${e.message}`);
    }
  }
  await client.end();
}

run().catch(e => console.error("Fatal:", e.message));
