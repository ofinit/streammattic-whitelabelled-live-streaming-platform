-- =============================================================================
-- Photo gallery add-on (control plane) — user_addon_entitlements
-- =============================================================================
-- Additive only. Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/ensure-photo-gallery-addon-schema.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_addon_entitlements (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  photo_gallery_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_addon_entitlements_gallery ON user_addon_entitlements(user_id)
  WHERE photo_gallery_enabled = true;
