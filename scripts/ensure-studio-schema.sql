-- Idempotent fixes for studio setup + dashboard (run via npm run db:migrate:env or Coolify migration)
-- Fixes: studio_branding.tagline for POST /api/studio/setup; orders.studio_id for /api/studio/dashboard stats

ALTER TABLE studio_branding ADD COLUMN IF NOT EXISTS tagline TEXT;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_studio_id ON orders(studio_id);

-- Studio setup wizard completion (sidebar + /studio/setup redirect)
ALTER TABLE studio_branding ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ;
UPDATE studio_branding
SET setup_completed_at = COALESCE(updated_at, created_at)
WHERE setup_completed_at IS NULL
  AND setup_wizard_draft IS NULL
  AND support_email IS NOT NULL
  AND trim(support_email) <> '';
