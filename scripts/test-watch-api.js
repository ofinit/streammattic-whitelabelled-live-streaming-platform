require("dotenv").config({ path: ".env.local" })
const { Pool } = require('pg');
const { toCamel } = require('../lib/db'); // This might fail because of TS/ESM

async function test() {
  const dbUrl = process.env.DATABASE_URL;
  const client = new Pool({ connectionString: dbUrl });

  const eventId = 'birthday-party-bash-hyvxa';
  console.log('Testing eventId:', eventId);

  try {
    const query = `
      SELECT e.*, 
             u.name AS studio_name,
             u.platform_name,
             u.logo_url,
             u.primary_color,
             u.secondary_color,
             u.custom_domain,
             (
               SELECT json_agg(json_build_object(
                 'id', ed.id,
                 'label', ed.label,
                 'scheduledAt', ed.scheduled_at,
                 'timezone', ed.timezone,
                 'streamKey', ed.stream_key,
                 'rtmpUrl', ed.rtmp_url,
                 'sortOrder', ed.sort_order
               ) ORDER BY ed.sort_order)
               FROM event_dates ed
               WHERE ed.event_id = e.id
             ) as event_dates
      FROM events e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id::text = $1 OR e.slug = $1
    `;
    
    const { rows } = await client.query(query, [eventId]);
    console.log('Rows found:', rows.length);
    if (rows.length > 0) {
      const eventData = rows[0];
      console.log('Event ID:', eventData.id);
      
      // Test the camel conversion manually if I can't import
      const camelized = {};
      for (const key of Object.keys(eventData)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        camelized[camelKey] = eventData[key];
      }
      console.log('Camelized userId:', camelized.userId);
    }
  } catch (err) {
    console.error('Query Error:', err);
  } finally {
    await client.end();
  }
}

test();
