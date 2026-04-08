-- Stream type "pending": event shell with no encoder chosen yet; 30-day TTL on create (server).
-- Requires PostgreSQL 9.1+ (ADD VALUE); IF NOT EXISTS requires PG 10+ for some builds — use run-migration idempotent line.
ALTER TYPE stream_type_key ADD VALUE IF NOT EXISTS 'pending';
