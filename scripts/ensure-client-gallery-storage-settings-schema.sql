-- =============================================================================
-- Client gallery — per-user S3-compatible storage (BYOS), encrypted secret at rest
-- =============================================================================
-- Additive only. Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/ensure-client-gallery-storage-settings-schema.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS client_gallery_storage_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  s3_endpoint TEXT,
  s3_region TEXT NOT NULL DEFAULT 'auto',
  s3_bucket TEXT NOT NULL,
  s3_access_key_id TEXT NOT NULL,
  s3_secret_access_key_encrypted TEXT NOT NULL,
  s3_force_path_style BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
