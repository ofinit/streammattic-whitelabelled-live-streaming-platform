-- =============================================================================
-- Client gallery: person identities + face instances (AWS Rekognition–backed)
-- =============================================================================
-- Additive only. Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/ensure-client-gallery-face-identity-schema.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS client_gallery_person_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES client_gallery_albums(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_gallery_person_identities_album_id
  ON client_gallery_person_identities(album_id);

CREATE TABLE IF NOT EXISTS client_gallery_face_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES client_gallery_albums(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES client_gallery_assets(id) ON DELETE CASCADE,
  person_identity_id UUID NOT NULL REFERENCES client_gallery_person_identities(id) ON DELETE CASCADE,
  rekognition_face_id TEXT,
  bbox_left DOUBLE PRECISION NOT NULL,
  bbox_top DOUBLE PRECISION NOT NULL,
  bbox_width DOUBLE PRECISION NOT NULL,
  bbox_height DOUBLE PRECISION NOT NULL,
  thumb_s3_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_gallery_face_instances_rekognition_face_id
  ON client_gallery_face_instances(rekognition_face_id)
  WHERE rekognition_face_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_gallery_face_instances_album_id
  ON client_gallery_face_instances(album_id);

CREATE INDEX IF NOT EXISTS idx_client_gallery_face_instances_asset_id
  ON client_gallery_face_instances(asset_id);

CREATE INDEX IF NOT EXISTS idx_client_gallery_face_instances_person_identity_id
  ON client_gallery_face_instances(person_identity_id);
