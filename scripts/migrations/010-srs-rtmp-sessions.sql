-- SRS RTMP token authentication, usage tracking, and DVR merge state.
-- One RTMP credit covers 360 minutes; additional 360-minute blocks are
-- charged by the publish/unpublish lifecycle.

CREATE TABLE IF NOT EXISTS event_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  scheduled_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  stream_key TEXT,
  rtmp_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_dates_event_id ON event_dates(event_id);

CREATE TABLE IF NOT EXISTS stream_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  event_date_id UUID REFERENCES event_dates(id) ON DELETE CASCADE,
  stream_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_hint TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_tokens_user_id ON stream_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_tokens_event_id ON stream_tokens(event_id);
CREATE INDEX IF NOT EXISTS idx_stream_tokens_stream_id ON stream_tokens(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_tokens_active_expires ON stream_tokens(is_active, expires_at);

CREATE TABLE IF NOT EXISTS stream_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  event_date_id UUID REFERENCES event_dates(id) ON DELETE SET NULL,
  token_id UUID REFERENCES stream_tokens(id) ON DELETE SET NULL,
  stream_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_publish_at TIMESTAMPTZ,
  last_unpublish_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT false,
  accumulated_seconds INTEGER NOT NULL DEFAULT 0,
  included_credit_blocks INTEGER NOT NULL DEFAULT 1,
  charged_extra_blocks INTEGER NOT NULL DEFAULT 0,
  merge_after TIMESTAMPTZ,
  merge_status TEXT NOT NULL DEFAULT 'pending',
  merged BOOLEAN NOT NULL DEFAULT false,
  merged_at TIMESTAMPTZ,
  final_recording_path TEXT,
  final_recording_url TEXT,
  merge_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_sessions_stream_id ON stream_sessions(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_event_id ON stream_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_active ON stream_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_merge_ready ON stream_sessions(merge_status, merge_after)
  WHERE merged = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_stream_sessions_one_active_stream
  ON stream_sessions(stream_id)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS stream_session_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES stream_sessions(id) ON DELETE CASCADE,
  token_id UUID REFERENCES stream_tokens(id) ON DELETE SET NULL,
  stream_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  publisher_ip TEXT,
  srs_client_id TEXT,
  raw_publish_payload JSONB NOT NULL DEFAULT '{}',
  raw_unpublish_payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_segments_session_id ON stream_session_segments(session_id);
CREATE INDEX IF NOT EXISTS idx_stream_segments_stream_id ON stream_session_segments(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_segments_open ON stream_session_segments(stream_id, ended_at)
  WHERE ended_at IS NULL;

CREATE TABLE IF NOT EXISTS stream_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  session_id UUID REFERENCES stream_sessions(id) ON DELETE SET NULL,
  stream_id TEXT NOT NULL,
  seconds_used INTEGER NOT NULL DEFAULT 0,
  minutes_used INTEGER NOT NULL DEFAULT 0,
  credit_blocks_charged INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT 'rtmp_session',
  credit_deduction_id UUID REFERENCES credit_deductions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_usage_user_id ON stream_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_usage_session_id ON stream_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_stream_usage_stream_id ON stream_usage(stream_id);

CREATE TABLE IF NOT EXISTS stream_publish_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id TEXT,
  token_hash TEXT,
  app TEXT,
  ip TEXT,
  allowed BOOLEAN NOT NULL DEFAULT false,
  reason TEXT NOT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_publish_attempts_stream_id ON stream_publish_attempts(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_publish_attempts_created_at ON stream_publish_attempts(created_at DESC);

CREATE TABLE IF NOT EXISTS stream_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES stream_sessions(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  stream_id TEXT NOT NULL,
  source_dir TEXT NOT NULL,
  output_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'merged',
  error_message TEXT,
  merged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_recordings_stream_id ON stream_recordings(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_recordings_session_id ON stream_recordings(session_id);

CREATE TABLE IF NOT EXISTS stream_recording_deletion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID,
  event_slug TEXT,
  stream_ids JSONB NOT NULL DEFAULT '[]',
  paths JSONB NOT NULL DEFAULT '[]',
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_recording_deletion_jobs_status
  ON stream_recording_deletion_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_stream_recording_deletion_jobs_event_id
  ON stream_recording_deletion_jobs(event_id);
