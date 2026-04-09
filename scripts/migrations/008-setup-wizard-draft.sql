-- Persist Studio setup wizard progress (autosave)
ALTER TABLE studio_branding ADD COLUMN IF NOT EXISTS setup_wizard_draft JSONB DEFAULT NULL;
