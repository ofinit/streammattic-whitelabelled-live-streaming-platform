ALTER TABLE events
  ADD COLUMN IF NOT EXISTS rtmp_provider TEXT NOT NULL DEFAULT 'srs',
  ADD COLUMN IF NOT EXISTS rtmp_provider_stream_id TEXT,
  ADD COLUMN IF NOT EXISTS rtmp_provider_payload JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_events_rtmp_provider ON events(rtmp_provider);
CREATE INDEX IF NOT EXISTS idx_events_rtmp_provider_stream_id ON events(rtmp_provider_stream_id);
