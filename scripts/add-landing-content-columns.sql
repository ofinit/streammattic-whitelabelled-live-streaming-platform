-- Migration: Add landing page content columns to studio_branding
-- Run this if you have an existing studio_branding table without the new columns

-- Add differentiators JSONB column
ALTER TABLE studio_branding
ADD COLUMN IF NOT EXISTS differentiators JSONB DEFAULT '[]';

-- Add CTA Banner columns
ALTER TABLE studio_branding
ADD COLUMN IF NOT EXISTS cta_banner_title TEXT;

ALTER TABLE studio_branding
ADD COLUMN IF NOT EXISTS cta_banner_subtitle TEXT;

ALTER TABLE studio_branding
ADD COLUMN IF NOT EXISTS cta_banner_button_text TEXT;

ALTER TABLE studio_branding
ADD COLUMN IF NOT EXISTS cta_banner_button_url TEXT;

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'studio_branding'
ORDER BY ordinal_position;
