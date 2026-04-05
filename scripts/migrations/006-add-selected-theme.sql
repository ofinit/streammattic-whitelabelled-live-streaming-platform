-- Add selected_theme to studio_branding table
ALTER TABLE studio_branding ADD COLUMN IF NOT EXISTS selected_theme VARCHAR(50) DEFAULT 'modern_emerald';
