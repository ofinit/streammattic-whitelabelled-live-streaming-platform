const { Client } = require("pg");
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

async function exec(client, query) {
  const r = await client.query(query);
  return { rows: r.rows };
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const templates = [
    `INSERT INTO event_templates (name, category, is_active, sort_order, fields) VALUES ('Basic Live Stream', 'general', true, 1, '{"title": true, "description": true, "thumbnail": true, "scheduled_at": true}')`,
    `INSERT INTO event_templates (name, category, is_active, sort_order, fields) VALUES ('Webinar', 'education', true, 2, '{"title": true, "description": true, "thumbnail": true, "scheduled_at": true, "speaker": true, "agenda": true}')`,
    `INSERT INTO event_templates (name, category, is_active, sort_order, fields) VALUES ('Product Launch', 'business', true, 3, '{"title": true, "description": true, "thumbnail": true, "scheduled_at": true, "countdown": true, "cta_url": true}')`,
  ];

  let ok = 0, fail = 0;
  for (const stmt of templates) {
    try {
      await exec(client, stmt);
      ok++;
    } catch (e) {
      console.error("FAIL:", e.message.substring(0, 200));
      fail++;
    }
  }
  console.log(`Templates: ${ok} ok, ${fail} failed`);

  // Verify everything
  const tables = await exec(client, "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log(`\nTotal tables: ${tables.rows.length}`);
  console.log("Tables:", tables.rows.map(r => r.table_name).join(", "));

  const users = await exec(client, "SELECT id, email, name, role FROM users");
  console.log(`\nUsers: ${users.rows.length}`);
  if (users.rows.length > 0) console.log("Admin:", JSON.stringify(users.rows[0]));

  const settings = await exec(client, "SELECT key FROM platform_settings");
  console.log(`\nPlatform settings: ${settings.rows.length}`);
  console.log("Keys:", settings.rows.map(r => r.key).join(", "));

  const tpls = await exec(client, "SELECT name, category FROM event_templates");
  console.log(`\nEvent templates: ${tpls.rows.length}`);
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
