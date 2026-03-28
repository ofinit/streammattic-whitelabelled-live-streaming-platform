const { Client } = require('pg')

const c = new Client({ connectionString: process.env.DATABASE_URL })
c.connect().then(async () => {
  await c.query("ALTER TABLE events ALTER COLUMN timezone SET DEFAULT 'Asia/Kolkata'")
  const r = await c.query(
    "UPDATE events SET timezone='Asia/Kolkata' WHERE timezone='UTC' OR timezone IS NULL RETURNING id, title, timezone"
  )
  console.log('Updated:', r.rows)
  c.end()
})
