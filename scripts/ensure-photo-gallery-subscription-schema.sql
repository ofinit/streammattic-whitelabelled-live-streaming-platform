-- =============================================================================
-- Client photo gallery — subscription, opt-in, renewal reminder dedup
-- =============================================================================
-- Additive only. Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/ensure-photo-gallery-subscription-schema.sql
-- =============================================================================

ALTER TYPE txn_category ADD VALUE IF NOT EXISTS 'photo_gallery_subscription';
ALTER TYPE txn_category ADD VALUE IF NOT EXISTS 'photo_gallery_usage';

ALTER TABLE user_addon_entitlements ADD COLUMN IF NOT EXISTS photo_gallery_opt_in BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE user_addon_entitlements ADD COLUMN IF NOT EXISTS photo_gallery_subscription_expires_at TIMESTAMPTZ;
ALTER TABLE user_addon_entitlements ADD COLUMN IF NOT EXISTS photo_gallery_billing_period_start TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS photo_gallery_renewal_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_end_at TIMESTAMPTZ NOT NULL,
  reminder_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, period_end_at, reminder_key)
);

CREATE INDEX IF NOT EXISTS idx_photo_gallery_renewal_reminders_user
  ON photo_gallery_renewal_reminders(user_id);
