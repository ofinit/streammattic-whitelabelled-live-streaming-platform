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
  console.log("=== Creating remaining indexes ===");

  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_refund_requested_by ON refund_requests(requested_by)`,
    `CREATE INDEX IF NOT EXISTS idx_refund_status ON refund_requests(status)`,
    `CREATE INDEX IF NOT EXISTS idx_refund_event_id ON refund_requests(event_id)`,
    `CREATE INDEX IF NOT EXISTS idx_wallet_adj_target ON wallet_adjustments(target_user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_wallet_adj_status ON wallet_adjustments(status)`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_recipient ON invoices(recipient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_issuer ON invoices(issuer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`,
    `CREATE INDEX IF NOT EXISTS idx_youtube_owner ON youtube_channels(owner_id)`,
    `CREATE INDEX IF NOT EXISTS idx_youtube_channel ON youtube_channels(channel_id)`,
  ];

  for (const idx of indexes) {
    try { await exec(client, idx); console.log("OK:", idx.substring(0, 60)); }
    catch (e) { console.log("FAIL:", idx.substring(0, 60), e.message.substring(0, 100)); }
  }

  console.log("\n=== Inserting seed data ===");
  // No default admin@streamlivee.com seed — use scripts/seed-production-admin.js

  // Platform settings
  const settings = [
    { key: 'platform_name', value: { name: 'StreamLivee', tagline: 'Professional Live Streaming Platform' } },
    { key: 'stream_type_pricing', value: {
      rtmp: { basePrice: 1500, enabled: true, label: 'RTMP Server', description: 'Use OBS/Wirecast' },
      youtube_api: { basePrice: 1000, enabled: true, label: 'YouTube API', description: 'Direct broadcast', recommended: true },
      youtube_embed: { basePrice: 500, enabled: true, label: 'YouTube Embed', description: 'Embed existing' },
      third_party: { basePrice: 400, enabled: true, label: 'Third Party', description: 'External embed' }
    }},
    { key: 'volume_discount_tiers', value: {
      rtmp: [
        { minQty: 5, maxQty: 9, pricePerCredit: 1350, label: '5-Pack (10% off)', enabled: true },
        { minQty: 10, maxQty: 24, pricePerCredit: 1200, label: '10-Pack (20% off)', enabled: true },
        { minQty: 25, maxQty: 49, pricePerCredit: 1050, label: '25-Pack (30% off)', enabled: true },
        { minQty: 50, maxQty: null, pricePerCredit: 900, label: '50-Pack (40% off)', enabled: true }
      ],
      youtube_api: [
        { minQty: 5, maxQty: 9, pricePerCredit: 900, label: '5-Pack (10% off)', enabled: true },
        { minQty: 10, maxQty: 24, pricePerCredit: 800, label: '10-Pack (20% off)', enabled: true },
        { minQty: 25, maxQty: 49, pricePerCredit: 700, label: '25-Pack (30% off)', enabled: true },
        { minQty: 50, maxQty: null, pricePerCredit: 600, label: '50-Pack (40% off)', enabled: true }
      ],
      youtube_embed: [
        { minQty: 5, maxQty: 9, pricePerCredit: 450, label: '5-Pack (10% off)', enabled: true },
        { minQty: 10, maxQty: 24, pricePerCredit: 400, label: '10-Pack (20% off)', enabled: true },
        { minQty: 25, maxQty: 49, pricePerCredit: 350, label: '25-Pack (30% off)', enabled: true },
        { minQty: 50, maxQty: null, pricePerCredit: 300, label: '50-Pack (40% off)', enabled: true }
      ],
      third_party: [
        { minQty: 5, maxQty: 9, pricePerCredit: 360, label: '5-Pack (10% off)', enabled: true },
        { minQty: 10, maxQty: 24, pricePerCredit: 320, label: '10-Pack (20% off)', enabled: true },
        { minQty: 25, maxQty: 49, pricePerCredit: 280, label: '25-Pack (30% off)', enabled: true },
        { minQty: 50, maxQty: null, pricePerCredit: 240, label: '50-Pack (40% off)', enabled: true }
      ]
    }},
    { key: 'validity_extensions', value: {
      defaultDays: 30,
      options: [
        { days: 60, extraDays: 30, creditCost: 1, label: '60 Days (+1 credit)', enabled: true },
        { days: 90, extraDays: 60, creditCost: 2, label: '90 Days (+2 credits)', enabled: true },
        { days: 180, extraDays: 150, creditCost: 5, label: '180 Days (+5 credits)', enabled: true },
        { days: 365, extraDays: 335, creditCost: 12, label: '365 Days (+12 credits)', enabled: true }
      ]
    }},
    { key: 'simulcast_pricing', value: {
      youtube: { pricePerEvent: 75, enabled: true },
      facebook: { pricePerEvent: 75, enabled: true },
      custom_rtmp: { pricePerEvent: 100, enabled: true }
    }},
    { key: 'studio_annual_subscription', value: { price: 1800000, enabled: true } },
    { key: 'gst_config', value: { enabled: true, percentage: 18, gstNumber: '', businessName: 'StreamLivee' } },
    { key: 'payment_gateways', value: {
      razorpay: { enabled: false, keyId: '', keySecret: '' },
      instamojo: { enabled: false, apiKey: '', authToken: '', sandbox: true }
    }},
  ];

  for (const s of settings) {
    try {
      const val = JSON.stringify(s.value).replace(/'/g, "''");
      await exec(client, `INSERT INTO platform_settings (key, value) VALUES ('${s.key}', '${val}'::jsonb) ON CONFLICT (key) DO UPDATE SET value = '${val}'::jsonb, updated_at = NOW()`);
      console.log("OK: Setting", s.key);
    } catch (e) { console.log("FAIL setting", s.key, ":", e.message.substring(0, 150)); }
  }

  // Event templates
  const templates = [
    { name: 'Basic Stream', stream_type: 'rtmp', description: 'Simple RTMP streaming event', is_default: true },
    { name: 'YouTube Live', stream_type: 'youtube_api', description: 'YouTube API live broadcast', is_default: false },
    { name: 'YouTube Embed', stream_type: 'youtube_embed', description: 'Embed existing YouTube stream', is_default: false },
  ];

  for (const t of templates) {
    try {
      const config = JSON.stringify({}).replace(/'/g, "''");
      await exec(client, `INSERT INTO event_templates (name, stream_type, description, is_default, default_config)
        VALUES ('${t.name}', '${t.stream_type}', '${t.description}', ${t.is_default}, '${config}'::jsonb)
        ON CONFLICT DO NOTHING`);
      console.log("OK: Template", t.name);
    } catch (e) { console.log("FAIL template", t.name, ":", e.message.substring(0, 100)); }
  }

  console.log("\n=== Migration complete ===");
  await client.end();
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
