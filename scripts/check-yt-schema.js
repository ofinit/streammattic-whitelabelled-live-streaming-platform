const { Client } = require('pg')
const c = new Client({ connectionString: process.env.DATABASE_URL })
c.connect().then(async () => {
  const r = await c.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename='youtube_channels'")
  console.log(r.rows.map(x => `${x.indexname}: ${x.indexdef}`).join('\n'))
  c.end()
}).catch(e => { console.error(e.message); process.exit(1) })
