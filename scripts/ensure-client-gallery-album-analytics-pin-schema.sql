-- =============================================================================
-- Client gallery albums — guest analytics + optional guest PIN
-- =============================================================================
-- Additive only. Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/ensure-client-gallery-album-analytics-pin-schema.sql
-- =============================================================================

ALTER TABLE client_gallery_albums ADD COLUMN IF NOT EXISTS guest_view_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE client_gallery_albums ADD COLUMN IF NOT EXISTS last_guest_view_at TIMESTAMPTZ;
ALTER TABLE client_gallery_albums ADD COLUMN IF NOT EXISTS guest_pin_required BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE client_gallery_albums ADD COLUMN IF NOT EXISTS guest_pin TEXT;

UPDATE client_gallery_albums SET guest_view_count = 0 WHERE guest_view_count IS NULL;
