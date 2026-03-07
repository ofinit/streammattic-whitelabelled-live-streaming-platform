import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

console.log("Creating youtube_channels table...");
await sql`
  CREATE TABLE IF NOT EXISTS youtube_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id TEXT NOT NULL,
    owner_type TEXT NOT NULL CHECK (owner_type IN ('admin', 'reseller', 'user')),
    channel_id TEXT NOT NULL,
    channel_title TEXT NOT NULL,
    channel_thumbnail TEXT,
    subscriber_count INTEGER DEFAULT 0,
    video_count INTEGER DEFAULT 0,
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_id, owner_type, channel_id)
  )
`;
console.log("youtube_channels created.");

console.log("Creating youtube_channels index...");
await sql`CREATE INDEX IF NOT EXISTS idx_youtube_channels_owner ON youtube_channels(owner_id, owner_type)`;
console.log("Index created.");

console.log("Creating youtube_broadcasts table...");
await sql`
  CREATE TABLE IF NOT EXISTS youtube_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    youtube_channel_id UUID NOT NULL REFERENCES youtube_channels(id) ON DELETE CASCADE,
    broadcast_id TEXT NOT NULL,
    stream_id TEXT,
    rtmp_url TEXT,
    stream_key TEXT,
    broadcast_status TEXT DEFAULT 'created' CHECK (broadcast_status IN ('created', 'ready', 'testing', 'live', 'complete', 'revoked')),
    privacy_status TEXT DEFAULT 'unlisted' CHECK (privacy_status IN ('public', 'unlisted', 'private')),
    scheduled_start TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    enable_dvr BOOLEAN DEFAULT true,
    enable_auto_start BOOLEAN DEFAULT true,
    enable_auto_stop BOOLEAN DEFAULT true,
    enable_low_latency BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`;
console.log("youtube_broadcasts created.");

console.log("Creating youtube_broadcasts indexes...");
await sql`CREATE INDEX IF NOT EXISTS idx_youtube_broadcasts_event ON youtube_broadcasts(event_id)`;
await sql`CREATE INDEX IF NOT EXISTS idx_youtube_broadcasts_channel ON youtube_broadcasts(youtube_channel_id)`;
console.log("Indexes created.");

// Verify
const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'youtube_%'`;
console.log("Verified tables:", tables.map(r => r.table_name));
console.log("Migration complete!");
