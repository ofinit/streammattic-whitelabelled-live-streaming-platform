const { Pool } = require('pg');

async function checkSchema() {
  const client = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const res = await client.query('SELECT NOW()');
    console.log('Connected to database at:', res.rows[0].now);

    const tablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', tablesRes.rows.map(r => r.table_name).join(', '));

    const columnsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'events'
      ORDER BY ordinal_position
    `);
    console.log('\nEvents Column Schema:');
    columnsRes.rows.forEach(r => console.log(`- ${r.column_name}: ${r.data_type}`));

    const countRes = await client.query('SELECT count(*) FROM events');
    console.log('\nTotal Events:', countRes.rows[0].count);

    if (countRes.rows[0].count > 0) {
      const sampleRes = await client.query('SELECT id, slug, user_id FROM events LIMIT 5');
      console.log('\nSample Events:', JSON.stringify(sampleRes.rows, null, 2));
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkSchema();
