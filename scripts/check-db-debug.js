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

    const userRes = await client.query(`
      SELECT id, email, name, role FROM users WHERE email = 'meghaevents999@gmail.com'
    `);
    console.log('USER:', userRes.rows);
    if (userRes.rows.length === 0) return;
    const userId = userRes.rows[0].id;

    const creditsRes = await client.query(`
      SELECT * FROM user_credits WHERE user_id = $1
    `, [userId]);
    console.log('\nUSER CREDITS:', creditsRes.rows);

    const walletTxRes = await client.query(`
      SELECT * FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) ORDER BY created_at DESC
    `, [userId]);
    console.log('\nWALLET TRANSACTIONS:', walletTxRes.rows);

    const creditTxRes = await client.query(`
      SELECT * FROM credit_transactions WHERE user_id = $1 ORDER BY created_at DESC
    `, [userId]);
    console.log('\nCREDIT TRANSACTIONS:', creditTxRes.rows);

    const eventsRes = await client.query(`
      SELECT id, title, stream_type, status, created_at FROM events WHERE user_id = $1 ORDER BY created_at DESC
    `, [userId]);
    console.log('\nUSER EVENTS:', eventsRes.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkSchema();
