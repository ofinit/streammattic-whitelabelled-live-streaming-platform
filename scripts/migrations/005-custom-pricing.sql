-- Migration 005: Add per-user custom pricing override column
-- Each user can have a JSONB blob that fully overrides any combination of:
--   streamTypePricing, simulcastPricing, validityTiers, studioSubscription, aiImagePricing

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS custom_pricing JSONB DEFAULT NULL;

COMMENT ON COLUMN users.custom_pricing IS 
  'Admin-configured per-user pricing overrides. JSONB with optional keys: streamTypePricing, simulcastPricing, validityTiers, studioSubscription, aiImagePricing, bonusCredits. NULL = use master platform_settings.';
