const { Pool } = require('pg');

async function fixMissingValidity() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('DATABASE_URL not found in process.env. Did you run with --env-file?');
        process.exit(1);
    }

    const sslConfigs = [
        { rejectUnauthorized: false }, // Common for Neon/Cloud
        false // Common for local development
    ];

    let pool;
    let success = false;

    for (const ssl of sslConfigs) {
        try {
            console.log(`Attempting connection with SSL: ${JSON.stringify(ssl)}...`);
            pool = new Pool({
                connectionString: databaseUrl,
                ssl: ssl
            });

            const result = await pool.query(`
                UPDATE events 
                SET validity_expires_at = created_at + INTERVAL '30 days'
                WHERE validity_expires_at IS NULL
                RETURNING id
            `);

            console.log(`Successfully updated ${result.rows.length} events with default validity.`);
            success = true;
            break;
        } catch (error) {
            console.error(`Connection failed with SSL: ${JSON.stringify(ssl)}:`, error.message);
            if (pool) await pool.end();
        }
    }

    if (success) {
        process.exit(0);
    } else {
        console.error('Failed to connect to database with all attempted SSL configurations.');
        process.exit(1);
    }
}

fixMissingValidity();
