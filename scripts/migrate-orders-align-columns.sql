-- Align `orders` with payment API (schema-complete / app).
-- Run once on existing DBs: psql "$DATABASE_URL" -f scripts/migrate-orders-align-columns.sql
-- Or: node with pg client.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_order_id TEXT;
