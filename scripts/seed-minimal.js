const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function seed() {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/DATABASE_URL=(["'])?(.+?)\1(\s|$)/);
      if (match) dbUrl = match[2];
    }
  }

  const client = new Pool({ connectionString: dbUrl });

  try {
    const userRes = await client.query("SELECT id FROM users WHERE email = 'streamer@example.com' OR role = 'streamer' LIMIT 1");
    let userId;
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
    } else {
      const insertUser = await client.query("INSERT INTO users (name, email, role, status, password_hash) VALUES ('Test Streamer', 'streamer@example.com', 'streamer', 'active', 'dummy_hash') RETURNING id");
      userId = insertUser.rows[0].id;
    }

    const slug = 'birthday-party-bash-hyvxa';
    await client.query("DELETE FROM events WHERE slug = $1", [slug]);
    
    await client.query(`
      INSERT INTO events (
        user_id, title, description, status, stream_type, slug, 
        scheduled_at, timezone, allow_chat, allow_reactions,
        hero_image_url, crew_pin_hash
      ) VALUES (
        $1, 'Birthday Party Bash', 'Join us for a fun birthday celebration!', 'scheduled', 'rtmp', $2,
        NOW() + INTERVAL '1 day', 'UTC', true, true,
        'https://images.unsplash.com/photo-1464349172904-484ed39a897f',
        'e10adc3949ba59abbe56e057f20f883e' -- 123456 md5
      )
    `, [userId, slug]);

    console.log('Seed successful for slug:', slug);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await client.end();
  }
}

seed();
