-- =============================================================================
-- Client gallery albums — metadata + guest gallery template id
-- =============================================================================
-- Additive only. Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/ensure-client-gallery-album-metadata-schema.sql
-- =============================================================================

ALTER TABLE client_gallery_albums ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE client_gallery_albums ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE client_gallery_albums ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE client_gallery_albums ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE client_gallery_albums ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
ALTER TABLE client_gallery_albums ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE client_gallery_albums ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE client_gallery_albums ADD COLUMN IF NOT EXISTS gallery_template_id TEXT NOT NULL DEFAULT 'midnight-elegance';

UPDATE client_gallery_albums SET gallery_template_id = 'midnight-elegance' WHERE gallery_template_id IS NULL;
