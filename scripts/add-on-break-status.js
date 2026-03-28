const { Client } = require('pg')

const c = new Client({ connectionString: process.env.DATABASE_URL })
c.connect().then(async () => {
  await c.query("ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'on_break'")
  console.log('Added on_break to event_status enum')
  c.end()
}).catch(e => { console.error(e.message); process.exit(1) })
