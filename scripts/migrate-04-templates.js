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
  const templates = [
    `INSERT INTO event_templates (name, category, is_active, sort_order, fields) VALUES ('Basic Live Stream', 'general', true, 1, '{"title": true, "description": true, "thumbnail": true, "scheduled_at": true}')`,
    `INSERT INTO event_templates (name, category, is_active, sort_order, fields) VALUES ('Webinar', 'education', true, 2, '{"title": true, "description": true, "thumbnail": true, "scheduled_at": true, "speaker": true, "agenda": true}')`,
    `INSERT INTO event_templates (name, category, is_active, sort_order, fields) VALUES ('Product Launch', 'business', true, 3, '{"title": true, "description": true, "thumbnail": true, "scheduled_at": true, "countdown": true, "cta_url": true}')`,
  ];

  let ok = 0, fail = 0;
  for (const stmt of templates) {
    try {
      await exec(stmt);
      ok++;
    } catch (e) {
      console.error("FAIL:", e.message.substring(0, 200));
      fail++;
    }
  }
  console.log(`Templates: ${ok} ok, ${fail} failed`);

  // Verify everything
  const tables = await exec("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log(`\nTotal tables: ${tables.rows.length}`);
  console.log("Tables:", tables.rows.map(r => r.table_name).join(", "));

  const users = await exec("SELECT id, email, name, role FROM users");
  console.log(`\nUsers: ${users.rows.length}`);
  if (users.rows.length > 0) console.log("Admin:", JSON.stringify(users.rows[0]));

  const settings = await exec("SELECT key FROM platform_settings");
  console.log(`\nPlatform settings: ${settings.rows.length}`);
  console.log("Keys:", settings.rows.map(r => r.key).join(", "));

  const tpls = await exec("SELECT name, category FROM event_templates");
  console.log(`\nEvent templates: ${tpls.rows.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
