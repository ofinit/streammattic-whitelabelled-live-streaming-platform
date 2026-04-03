/**
 * Migration: Add standard template/event page columns to events table.
 * Run with: node scripts/add-event-standard-fields.js
 * Requires DATABASE_URL in env.
 */
const { Client } = require("pg");

const c = new Client({ connectionString: process.env.DATABASE_URL });

const columns = [
  ["hero_image_url", "TEXT"],
  ["player_image_url", "TEXT"],
  ["photo_gallery_urls", "JSONB DEFAULT '[]'::jsonb"],
  ["photographer_logo_url", "TEXT"],
  ["photographer_contact", "JSONB DEFAULT '{}'::jsonb"],
  ["crew_pin_hash", "TEXT"],
];

async function run() {
  await c.connect();
  for (const [name, def] of columns) {
    await c.query(
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS ${name} ${def}`
    ).catch((e) => console.warn(`Column ${name}:`, e.message));
  }
  console.log("Event standard columns migration done.");
  await c.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
