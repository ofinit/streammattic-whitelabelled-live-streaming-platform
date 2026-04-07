const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function patch() {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/DATABASE_URL=(["'])?(.+?)\1(\s|$)/);
      if (match) dbUrl = match[2];
    }
  }

  if (!dbUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const client = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('supabase') || dbUrl.includes('neon') ? { rejectUnauthorized: false } : false
  });

  try {
    await client.query('SELECT NOW()');
    console.log('Connected to database');

    const queries = [
      // Events table
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS subtitle TEXT`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS hero_image_url TEXT`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS player_image_url TEXT`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS photo_gallery_urls JSONB DEFAULT '[]'`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS photographer_logo_url TEXT`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS photographer_contact JSONB DEFAULT '{}'`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS use_custom_domain BOOLEAN DEFAULT false`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS validity_expires_at TIMESTAMP`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS crew_pin_hash TEXT`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}'`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS show_recording BOOLEAN DEFAULT false`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS show_scheduled_page BOOLEAN DEFAULT false`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC'`,
      
      // Seed missing columns if they were not added before
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT false`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE`,

      // Type changes (using a safer approach for existing columns)
      `ALTER TABLE events ALTER COLUMN template_id TYPE TEXT`,
      `ALTER TABLE event_templates ALTER COLUMN id TYPE TEXT`,

      // Users table
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS mock_data_cleared BOOLEAN DEFAULT false`,

      // Add indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug)`,
      `CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id)`,
    ];

    for (const q of queries) {
      console.log(`Executing: ${q}`);
      await client.query(q).catch(err => {
        if (err.message.includes('already exists') || err.message.includes('already a column')) {
          console.log('  Skip: already exists');
        } else {
          console.error(`  Error: ${err.message}`);
        }
      });
    }

    console.log('\nPatching complete!');
  } catch (err) {
    console.error('Fatal Error:', err);
  } finally {
    await client.end();
  }
}

patch();
