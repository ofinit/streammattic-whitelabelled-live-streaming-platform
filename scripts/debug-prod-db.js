const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function debug() {
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
    console.error('DATABASE_URL not found in env or .env.local');
    process.exit(1);
  }

  console.log('Connecting to:', dbUrl.split('@')[1] || dbUrl); // log host part

  const client = new Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes('supabase') || dbUrl.includes('neon') ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Connected');

    const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

    console.log('\nChecking events table for slugs:');
    const slugs = await client.query(`SELECT id, slug, title, user_id FROM events LIMIT 10`);
    console.log(JSON.stringify(slugs.rows, null, 2));

    const birthdaySlug = 'birthday-party-bash-hyvxa';
    console.log(`\nSearching for slug: ${birthdaySlug}`);
    const found = await client.query(`SELECT id, slug FROM events WHERE slug = $1`, [birthdaySlug]);
    console.log('Found:', found.rows);

    const foundByIdOrSlug = await client.query(`SELECT id, slug FROM events WHERE id::text = $1 OR slug = $1`, [birthdaySlug]);
    console.log('Found by ID or Slug:', foundByIdOrSlug.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

debug();
