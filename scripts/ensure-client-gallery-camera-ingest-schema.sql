-- =============================================================================
-- Client gallery camera ingest credentials (FTP/SFTP gateway accounts)
-- =============================================================================
-- Additive only. Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/ensure-client-gallery-camera-ingest-schema.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS client_gallery_camera_ingest_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  album_id UUID NOT NULL REFERENCES client_gallery_albums(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Camera upload',
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  upload_prefix TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  gateway_user_id TEXT,
  last_upload_at TIMESTAMPTZ,
  imported_asset_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_gallery_camera_ingest_username
  ON client_gallery_camera_ingest_credentials(username);

CREATE INDEX IF NOT EXISTS idx_client_gallery_camera_ingest_album_id
  ON client_gallery_camera_ingest_credentials(album_id);

CREATE INDEX IF NOT EXISTS idx_client_gallery_camera_ingest_user_id
  ON client_gallery_camera_ingest_credentials(user_id);

CREATE INDEX IF NOT EXISTS idx_client_gallery_camera_ingest_enabled
  ON client_gallery_camera_ingest_credentials(enabled)
  WHERE enabled = true;

