-- =============================================================================
-- Visitor leads schema (additive only — safe for production)
-- =============================================================================
-- Does NOT delete, truncate, or overwrite existing rows.
-- Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS only.
--
-- Apply with superuser or a role that can ALTER your tables (and optionally
-- CREATE EXTENSION — often superuser-only on managed Postgres):
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/ensure-visitor-leads-schema.sql
--
-- If CREATE EXTENSION fails, on PostgreSQL 13+ gen_random_uuid() still works
-- without pgcrypto; comment out the extension line and re-run.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Columns the /api/studio/events/:id/visitors route reads from events
ALTER TABLE events ADD COLUMN IF NOT EXISTS capture_visitor_data BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_studio_id ON events(studio_id);

-- Lead capture table (watch gate)
CREATE TABLE IF NOT EXISTS event_visitor_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  accept_language TEXT,
  referer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_country TEXT
);

-- Backfill columns on older tables created before these fields existed
ALTER TABLE event_visitor_registrations ADD COLUMN IF NOT EXISTS ip_country TEXT;
ALTER TABLE event_visitor_registrations ADD COLUMN IF NOT EXISTS accept_language TEXT;
ALTER TABLE event_visitor_registrations ADD COLUMN IF NOT EXISTS visitor_key TEXT;
ALTER TABLE event_visitor_registrations ADD COLUMN IF NOT EXISTS session_key TEXT;

CREATE INDEX IF NOT EXISTS idx_evr_event_created ON event_visitor_registrations(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evr_created ON event_visitor_registrations(created_at DESC);
