-- YouTube Channels: stores connected YouTube channels with encrypted OAuth tokens
-- Scoped by owner_id + owner_type so admin, resellers, and users each see only their own channels
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
);

-- Index for fast channel lookups by owner
CREATE INDEX IF NOT EXISTS idx_youtube_channels_owner ON youtube_channels(owner_id, owner_type);

-- YouTube Broadcasts: stores broadcasts linked to platform events
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
);

-- Index for fast broadcast lookups by event
CREATE INDEX IF NOT EXISTS idx_youtube_broadcasts_event ON youtube_broadcasts(event_id);
-- Index for fast broadcast lookups by channel
CREATE INDEX IF NOT EXISTS idx_youtube_broadcasts_channel ON youtube_broadcasts(youtube_channel_id);
