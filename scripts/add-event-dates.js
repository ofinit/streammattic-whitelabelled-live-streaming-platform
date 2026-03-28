const { Client } = require('pg')

const c = new Client({ connectionString: process.env.DATABASE_URL })
c.connect().then(async () => {
  await c.query(`
    CREATE TABLE IF NOT EXISTS event_dates (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      label        TEXT NOT NULL DEFAULT '',
      scheduled_at TIMESTAMPTZ NOT NULL,
      timezone     TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      stream_key   TEXT,
      rtmp_url     TEXT,
      sort_order   INT NOT NULL DEFAULT 0,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await c.query(`CREATE INDEX IF NOT EXISTS idx_event_dates_event_id ON event_dates(event_id)`)
  console.log('event_dates table created')
  c.end()
}).catch(e => { console.error(e.message); process.exit(1) })
