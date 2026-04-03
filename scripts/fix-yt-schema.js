const { Client } = require('pg')
const c = new Client({ connectionString: process.env.DATABASE_URL })
c.connect().then(async () => {
  // Add missing owner_type column (TEXT, nullable for backward compat)
  await c.query("ALTER TABLE youtube_channels ADD COLUMN IF NOT EXISTS owner_type TEXT NOT NULL DEFAULT 'studio'")
  // Add missing scopes column
  await c.query("ALTER TABLE youtube_channels ADD COLUMN IF NOT EXISTS scopes TEXT")
  // Add unique constraint for upsert
  await c.query("CREATE UNIQUE INDEX IF NOT EXISTS uq_youtube_channels_owner ON youtube_channels(owner_id, owner_type, channel_id)")
  console.log('youtube_channels schema fixed')
  c.end()
}).catch(e => { console.error(e.message); process.exit(1) })
