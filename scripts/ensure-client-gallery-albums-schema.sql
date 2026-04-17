-- =============================================================================
-- Client gallery (photographer albums, S3-backed) — not linked to events
-- =============================================================================
-- Additive only. Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/ensure-client-gallery-albums-schema.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS client_gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled album',
  public_token TEXT NOT NULL,
  s3_prefix TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_gallery_albums_public_token
  ON client_gallery_albums(public_token);

CREATE INDEX IF NOT EXISTS idx_client_gallery_albums_user_id
  ON client_gallery_albums(user_id);

CREATE TABLE IF NOT EXISTS client_gallery_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES client_gallery_albums(id) ON DELETE CASCADE,
  s3_key TEXT NOT NULL,
  content_type TEXT,
  byte_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (album_id, s3_key)
);

CREATE INDEX IF NOT EXISTS idx_client_gallery_assets_album_id
  ON client_gallery_assets(album_id);
