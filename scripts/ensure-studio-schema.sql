-- Idempotent fixes for studio setup + dashboard (run via npm run db:migrate:env or Coolify migration)
-- Fixes: studio_branding.tagline for POST /api/studio/setup; orders.studio_id for /api/studio/dashboard stats

ALTER TABLE studio_branding ADD COLUMN IF NOT EXISTS tagline TEXT;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_studio_id ON orders(studio_id);
