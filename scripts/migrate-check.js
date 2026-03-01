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
  // Check orders columns
  const o = await exec("SELECT column_name FROM information_schema.columns WHERE table_name='orders' ORDER BY ordinal_position");
  const orderCols = o.rows.map(r => r.column_name);
  console.log("Orders columns:", JSON.stringify(orderCols));

  // Check notifications columns
  const n = await exec("SELECT column_name FROM information_schema.columns WHERE table_name='notifications' ORDER BY ordinal_position");
  const notifCols = n.rows.map(r => r.column_name);
  console.log("Notifications columns:", JSON.stringify(notifCols));

  // Check existing indexes
  const idx = await exec("SELECT indexname FROM pg_indexes WHERE schemaname='public' ORDER BY indexname");
  const indexes = idx.rows.map(r => r.indexname);
  console.log("Index count:", indexes.length);
  
  // Now create missing indexes using actual column names
  const fixes = [];
  
  if (orderCols.includes("order_type")) fixes.push("CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type)");
  else if (orderCols.includes("type")) fixes.push('CREATE INDEX IF NOT EXISTS idx_orders_type ON orders("type")');
  
  if (notifCols.includes("is_read")) fixes.push("CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read)");
  else if (notifCols.includes("read")) fixes.push('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, "read")');

  // Try creating any other missing indexes
  const moreIndexes = [
    "CREATE INDEX IF NOT EXISTS idx_branding_user ON studio_branding(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_domains_user ON domains(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_refunds_user ON refund_requests(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_refunds_status ON refund_requests(status)",
    "CREATE INDEX IF NOT EXISTS idx_adjustments_user ON wallet_adjustments(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_adjustments_status ON wallet_adjustments(status)",
    "CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)",
    "CREATE INDEX IF NOT EXISTS idx_youtube_user ON youtube_channels(user_id)",
  ];
  fixes.push(...moreIndexes);

  let ok = 0, fail = 0;
  for (const sql of fixes) {
    try {
      await exec(sql);
      ok++;
    } catch (e) {
      console.log("SKIP:", sql.substring(0, 80), "->", e.message.substring(0, 100));
      fail++;
    }
  }
  console.log("Fix results: " + ok + " ok, " + fail + " failed");
}
main().catch(e => { console.error(e.message); process.exit(1); });
