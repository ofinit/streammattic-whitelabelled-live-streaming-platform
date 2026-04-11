-- =============================================================
-- StreamLivee – Complete Database Schema
-- Generated: 2026-04-04
-- =============================================================
-- 
-- This is the authoritative, idempotent schema for:
--   stream_livee_db  (PostgreSQL)
--
-- Safe to run on a fresh DB or a DB that already has objects.
-- Uses IF NOT EXISTS / OR REPLACE throughout.
--
-- Run with:
--   psql "postgresql://admin:PASS@host:5432/stream_livee_db" -f schema.sql
-- =============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- ENUM TYPES
-- =============================================================

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin','studio','streamer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('active','suspended','pending','deactivated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE event_status AS ENUM ('draft','scheduled','live','ended','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE stream_type_key AS ENUM ('rtmp','youtube_api','youtube_embed','third_party'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE stream_type_key ADD VALUE IF NOT EXISTS 'pending';
DO $$ BEGIN CREATE TYPE order_type AS ENUM ('credit_purchase','wallet_recharge','validity_extension','service_charge','studio_upgrade','annual_subscription'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_status AS ENUM ('pending','completed','failed','refunded','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_gateway AS ENUM ('razorpay','instamojo','wallet','manual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('pending','processing','completed','failed','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE txn_category AS ENUM ('top_up','credit_purchase','service_charge','order_refund','adjustment','manual_adjustment','payment_recovery','compensation','correction','goodwill','ai_image_generation','whitelabel_hosting','domain_registration','studio_upgrade','annual_subscription'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE refund_status AS ENUM ('pending','approved','rejected','processing','completed','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE refund_type AS ENUM ('event_cancellation','payment_failure','overcharge','service_issue','manual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE domain_verification_status AS ENUM ('pending','verified','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE domain_ssl_status AS ENUM ('pending','provisioning','active','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('system','payment','event','wallet','credit','refund','approval','warning','promotional'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE invoice_status AS ENUM ('draft','issued','paid','overdue','cancelled','void'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE adjustment_type AS ENUM ('credit','debit'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE adjustment_category AS ENUM ('goodwill','compensation','correction','manual_top_up','manual_debit','promotional','penalty'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE wallet_adjustment_status AS ENUM ('pending','approved','rejected','completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE youtube_token_status AS ENUM ('valid','expired','revoked'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE package_type AS ENUM ('event_pack','validity','addon','pay_per_event'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE pricing_model AS ENUM ('fixed','tiered','per_event','custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================
-- TABLE: users
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT        NOT NULL UNIQUE,
  name            TEXT        NOT NULL,
  phone           TEXT,
  billing_state   TEXT,
  password_hash   TEXT        NOT NULL,
  role            user_role   NOT NULL DEFAULT 'streamer',
  status          user_status NOT NULL DEFAULT 'active',
  avatar          TEXT,
  email_verified  BOOLEAN     NOT NULL DEFAULT false,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- =============================================================
-- TABLE: sessions  (custom sm_session cookie auth)
-- =============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE,
  ip_address  TEXT,
  user_agent  TEXT,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_token      ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- =============================================================
-- TABLE: login_sessions  (magic-link cross-device handshake)
-- =============================================================
CREATE TABLE IF NOT EXISTS login_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved')),
  user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_sessions_email      ON login_sessions(email);
CREATE INDEX IF NOT EXISTS idx_login_sessions_status     ON login_sessions(status);
CREATE INDEX IF NOT EXISTS idx_login_sessions_expires_at ON login_sessions(expires_at);

-- =============================================================
-- TABLE: wallets
-- =============================================================
CREATE TABLE IF NOT EXISTS wallets (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID    NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance     BIGINT  NOT NULL DEFAULT 0,
  currency    TEXT    NOT NULL DEFAULT 'INR',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- =============================================================
-- TABLE: wallet_transactions
-- =============================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id        UUID         NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type             TEXT         NOT NULL CHECK (type IN ('credit','debit')),
  category         txn_category NOT NULL,
  amount           BIGINT       NOT NULL,
  balance_before   BIGINT       NOT NULL,
  balance_after    BIGINT       NOT NULL,
  description      TEXT,
  reference_id     TEXT,
  reference_type   TEXT,
  base_amount      BIGINT,
  gst_amount       BIGINT       DEFAULT 0,
  gst_percentage   NUMERIC(5,2) DEFAULT 0,
  total_amount     BIGINT,
  invoice_number   TEXT,
  performed_by     UUID         REFERENCES users(id),
  reason           TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wtxn_wallet_id  ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wtxn_user_id    ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wtxn_category   ON wallet_transactions(category);
CREATE INDEX IF NOT EXISTS idx_wtxn_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wtxn_reference  ON wallet_transactions(reference_id, reference_type);

-- =============================================================
-- TABLE: user_credits
-- =============================================================
CREATE TABLE IF NOT EXISTS user_credits (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID    NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  rtmp            INT     NOT NULL DEFAULT 0,
  youtube_api     INT     NOT NULL DEFAULT 0,
  youtube_embed   INT     NOT NULL DEFAULT 0,
  third_party     INT     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: credit_purchases
-- =============================================================
CREATE TABLE IF NOT EXISTS credit_purchases (
  id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stream_type             stream_type_key NOT NULL,
  quantity                INT             NOT NULL,
  price_per_credit        BIGINT          NOT NULL,
  total_price             BIGINT          NOT NULL,
  discount_tier_label     TEXT,
  wallet_transaction_id   UUID            REFERENCES wallet_transactions(id),
  created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cp_user_id ON credit_purchases(user_id);

-- =============================================================
-- TABLE: credit_deductions
-- =============================================================
CREATE TABLE IF NOT EXISTS credit_deductions (
  id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stream_type   stream_type_key NOT NULL,
  amount        INT             NOT NULL DEFAULT 1,
  reason        TEXT            NOT NULL,
  event_id      UUID,
  validity_days INT,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cd_user_id ON credit_deductions(user_id);

-- =============================================================
-- TABLE: platform_settings
-- =============================================================
CREATE TABLE IF NOT EXISTS platform_settings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT        NOT NULL UNIQUE,
  value       JSONB       NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: packages
-- =============================================================
CREATE TABLE IF NOT EXISTS packages (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT          NOT NULL,
  slug                    TEXT          UNIQUE NOT NULL,
  type                    package_type  NOT NULL DEFAULT 'event_pack',
  pricing_model           pricing_model NOT NULL DEFAULT 'fixed',
  description             TEXT          DEFAULT '',
  price                   NUMERIC(12,2) NOT NULL DEFAULT 0,
  base_price_reseller     NUMERIC(12,2) DEFAULT 0,
  base_price_user         NUMERIC(12,2) DEFAULT 0,
  duration                INT           DEFAULT 30,
  max_events              INT           DEFAULT 1,
  max_concurrent_viewers  INT           DEFAULT 100,
  features                JSONB         DEFAULT '[]',
  is_active               BOOLEAN       DEFAULT true,
  sort_order              INT           DEFAULT 0,
  min_qty                 INT           DEFAULT 1,
  max_qty                 INT           DEFAULT 100,
  stream_type_pricing     JSONB,
  simulcast_pricing       JSONB,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_packages_slug   ON packages(slug);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_type   ON packages(type);

-- =============================================================
-- TABLE: events
-- =============================================================
CREATE TABLE IF NOT EXISTS events (
  id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  studio_id               UUID            REFERENCES users(id) ON DELETE SET NULL,
  title                   TEXT            NOT NULL,
  subtitle                TEXT,
  description             TEXT,
  thumbnail               TEXT,
  stream_type             stream_type_key NOT NULL,
  stream_key              TEXT,
  rtmp_url                TEXT,
  hls_url                 TEXT,
  youtube_url             TEXT,
  youtube_channel_name    TEXT,
  youtube_broadcast_id    TEXT,
  youtube_stream_id       TEXT,
  embed_code              TEXT,
  status                  event_status    NOT NULL DEFAULT 'draft',
  scheduled_at            TIMESTAMPTZ,
  started_at              TIMESTAMPTZ,
  ended_at                TIMESTAMPTZ,
  max_viewers             INT             DEFAULT 0,
  current_viewers         INT             DEFAULT 0,
  total_views             INT             DEFAULT 0,
  is_password_protected   BOOLEAN         NOT NULL DEFAULT false,
  event_password          TEXT,
  allow_chat              BOOLEAN         NOT NULL DEFAULT true,
  allow_reactions         BOOLEAN         NOT NULL DEFAULT true,
  simulcast_config        JSONB           DEFAULT '[]',
  template_id             UUID,
  template_data           JSONB           DEFAULT '{}',
  validity_expires_at     TIMESTAMPTZ,
  hero_image_url          TEXT,
  player_image_url        TEXT,
  photo_gallery_urls      JSONB           DEFAULT '[]',
  photographer_logo_url   TEXT,
  photographer_contact    JSONB           DEFAULT '{}',
  crew_pin_hash           TEXT,
  credits_consumed        INT             DEFAULT 1,
  slug                    TEXT            UNIQUE,
  credit_deduction_id     UUID            REFERENCES credit_deductions(id),
  metadata                JSONB           DEFAULT '{}',
  use_custom_domain       BOOLEAN         NOT NULL DEFAULT false,
  is_mock                 BOOLEAN         NOT NULL DEFAULT false,
  is_suspended            BOOLEAN         NOT NULL DEFAULT false,
  show_recording          BOOLEAN         NOT NULL DEFAULT false,
  capture_visitor_data    BOOLEAN         NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_user_id     ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_studio_id   ON events(studio_id);
CREATE INDEX IF NOT EXISTS idx_events_status      ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_scheduled_at ON events(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_events_stream_type ON events(stream_type);
CREATE INDEX IF NOT EXISTS idx_events_slug        ON events(slug);

-- =============================================================
-- TABLE: event_visitor_registrations (watch gate leads)
-- =============================================================
CREATE TABLE IF NOT EXISTS event_visitor_registrations (
  id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID            NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name        TEXT            NOT NULL,
  email            TEXT            NOT NULL,
  phone            TEXT            NOT NULL,
  ip_address       TEXT,
  user_agent       TEXT,
  accept_language  TEXT,
  referer          TEXT,
  utm_source       TEXT,
  utm_medium       TEXT,
  utm_campaign     TEXT,
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evr_event_created ON event_visitor_registrations(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evr_created ON event_visitor_registrations(created_at DESC);

-- =============================================================
-- TABLE: orders
-- =============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number         TEXT            NOT NULL UNIQUE,
  user_id              UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_type           order_type      NOT NULL,
  status               order_status    NOT NULL DEFAULT 'pending',
  stream_type          stream_type_key,
  quantity             INT,
  unit_price           BIGINT,
  total_price          BIGINT          NOT NULL,
  discount_tier_label  TEXT,
  event_id             UUID            REFERENCES events(id),
  validity_days        INT,
  credits_cost         INT,
  service_type         TEXT,
  payment_gateway      payment_gateway,
  payment_id           UUID,
  failure_reason       TEXT,
  description          TEXT,
  gateway_order_id     TEXT,
  metadata             JSONB           DEFAULT '{}',
  created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  completed_at         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_user_id      ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at   ON orders(created_at DESC);

-- =============================================================
-- TABLE: payments
-- =============================================================
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id            UUID            REFERENCES orders(id),
  amount              BIGINT          NOT NULL,
  gst_amount          BIGINT          DEFAULT 0,
  total_amount        BIGINT          NOT NULL,
  gateway             payment_gateway NOT NULL,
  status              payment_status  NOT NULL DEFAULT 'pending',
  gateway_order_id    TEXT,
  gateway_payment_id  TEXT,
  gateway_signature   TEXT,
  failure_reason      TEXT,
  metadata            JSONB           DEFAULT '{}',
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_user_id         ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order_id ON payments(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status          ON payments(status);

-- =============================================================
-- TABLE: payment_gateway_configs
-- =============================================================
CREATE TABLE IF NOT EXISTS payment_gateway_configs (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID            REFERENCES users(id) ON DELETE CASCADE,
  gateway     payment_gateway NOT NULL,
  is_enabled  BOOLEAN         NOT NULL DEFAULT false,
  is_default  BOOLEAN         NOT NULL DEFAULT false,
  config      JSONB           NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, gateway)
);

-- =============================================================
-- TABLE: studio_branding
-- =============================================================
CREATE TABLE IF NOT EXISTS studio_branding (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  platform_name       TEXT        NOT NULL DEFAULT 'My Studio',
  logo                TEXT,
  favicon             TEXT,
  primary_color       TEXT        DEFAULT '#10b981',
  secondary_color     TEXT        DEFAULT '#059669',
  support_email       TEXT,
  support_phone       TEXT,
  terms_url           TEXT,
  privacy_url         TEXT,
  custom_css          TEXT,
  hero_image          TEXT,
  about_image         TEXT,
  services            JSONB       DEFAULT '[]',
  event_types         JSONB       DEFAULT '[]',
  stats               JSONB       DEFAULT '[]',
  testimonials        JSONB       DEFAULT '[]',
  gallery_images      JSONB       DEFAULT '[]',
  meta_title          TEXT,
  meta_description    TEXT,
  -- Extended branding
  company_logo_dark   TEXT,
  whatsapp            TEXT,
  address             TEXT,
  facebook_url        TEXT,
  instagram_url       TEXT,
  twitter_url         TEXT,
  youtube_url         TEXT,
  linkedin_url        TEXT,
  google_analytics_id TEXT,
  about_us            TEXT,
  terms_conditions    TEXT,
  privacy_policy      TEXT,
  refund_policy       TEXT,
  preferred_gateway   TEXT,
  setup_wizard_draft  JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: domains
-- =============================================================
CREATE TABLE IF NOT EXISTS domains (
  id                    UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID                        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain                TEXT                        NOT NULL UNIQUE,
  verification_token    TEXT,
  verification_status   domain_verification_status  NOT NULL DEFAULT 'pending',
  ssl_status            domain_ssl_status            NOT NULL DEFAULT 'pending',
  is_primary            BOOLEAN                     NOT NULL DEFAULT false,
  dns_configured_via    TEXT,
  cf_record_ids         JSONB                       DEFAULT '[]',
  verified_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain  ON domains(domain);

-- =============================================================
-- TABLE: notifications
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT              NOT NULL,
  message     TEXT              NOT NULL,
  type        notification_type NOT NULL DEFAULT 'system',
  is_read     BOOLEAN           NOT NULL DEFAULT false,
  read_at     TIMESTAMPTZ,
  link        TEXT,
  data        JSONB             DEFAULT '{}',
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON notifications(user_id, is_read) WHERE is_read = false;

-- =============================================================
-- TABLE: refund_requests
-- =============================================================
CREATE TABLE IF NOT EXISTS refund_requests (
  id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  type                    refund_type     NOT NULL,
  event_id                UUID            REFERENCES events(id),
  order_id                UUID            REFERENCES orders(id),
  credit_purchase_id      UUID            REFERENCES credit_purchases(id),
  original_amount         BIGINT          NOT NULL DEFAULT 0,
  refund_amount           BIGINT          NOT NULL DEFAULT 0,
  gst_amount              BIGINT          DEFAULT 0,
  total_refund_amount     BIGINT          NOT NULL DEFAULT 0,
  related_transaction_ids TEXT[]          DEFAULT ARRAY[]::TEXT[],
  status                  refund_status   NOT NULL DEFAULT 'pending',
  requested_by            UUID            NOT NULL REFERENCES users(id),
  requested_by_role       user_role,
  requested_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  approved_by             UUID            REFERENCES users(id),
  approved_at             TIMESTAMPTZ,
  rejected_by             UUID            REFERENCES users(id),
  rejected_at             TIMESTAMPTZ,
  rejection_reason        TEXT,
  refund_method           TEXT,
  payment_gateway         payment_gateway,
  original_payment_id     TEXT,
  refund_transaction_id   UUID            REFERENCES wallet_transactions(id),
  completed_at            TIMESTAMPTZ,
  failure_reason          TEXT,
  created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refund_status       ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requested_by ON refund_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_refund_event_id     ON refund_requests(event_id);

-- =============================================================
-- TABLE: wallet_adjustments
-- =============================================================
CREATE TABLE IF NOT EXISTS wallet_adjustments (
  id                  UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id      UUID                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_role    user_role,
  type                adjustment_type         NOT NULL,
  amount              BIGINT                  NOT NULL,
  reason              TEXT                    NOT NULL,
  category            adjustment_category     NOT NULL,
  initiated_by        UUID                    NOT NULL REFERENCES users(id),
  initiated_at        TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  approval_required   BOOLEAN                 NOT NULL DEFAULT false,
  approved_by         UUID                    REFERENCES users(id),
  approved_at         TIMESTAMPTZ,
  status              wallet_adjustment_status NOT NULL DEFAULT 'completed',
  transaction_id      UUID                    REFERENCES wallet_transactions(id),
  notes               TEXT,
  created_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wadj_target_user_id ON wallet_adjustments(target_user_id);
CREATE INDEX IF NOT EXISTS idx_wadj_status         ON wallet_adjustments(status);

-- =============================================================
-- TABLE: gst_configurations
-- =============================================================
CREATE TABLE IF NOT EXISTS gst_configurations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  gst_type         TEXT        NOT NULL DEFAULT 'individual' CHECK (gst_type IN ('individual','business_registered','business_unregistered')),
  gst_enabled      BOOLEAN     NOT NULL DEFAULT false,
  gst_percentage   NUMERIC(5,2) DEFAULT 18.00,
  gst_number       TEXT,
  pan_number       TEXT,
  business_name    TEXT,
  business_address TEXT,
  city             TEXT,
  state            TEXT,
  pincode          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: invoices
-- =============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number        TEXT            NOT NULL UNIQUE,
  invoice_type          TEXT            NOT NULL DEFAULT 'tax_invoice',
  issuer_id             UUID            REFERENCES users(id),
  issuer_type           TEXT,
  issuer_business_name  TEXT,
  issuer_gst_number     TEXT,
  issuer_address        TEXT,
  recipient_id          UUID            REFERENCES users(id),
  recipient_type        TEXT,
  recipient_name        TEXT,
  recipient_email       TEXT,
  recipient_gst_number  TEXT,
  recipient_address     TEXT,
  base_amount           BIGINT          NOT NULL DEFAULT 0,
  gst_percentage        NUMERIC(5,2)    DEFAULT 0,
  cgst_amount           BIGINT          DEFAULT 0,
  sgst_amount           BIGINT          DEFAULT 0,
  igst_amount           BIGINT          DEFAULT 0,
  total_gst_amount      BIGINT          DEFAULT 0,
  total_amount          BIGINT          NOT NULL DEFAULT 0,
  transaction_id        UUID            REFERENCES wallet_transactions(id),
  payment_id            UUID            REFERENCES payments(id),
  payment_method        TEXT,
  payment_date          TIMESTAMPTZ,
  invoice_date          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  due_date              TIMESTAMPTZ,
  status                invoice_status  NOT NULL DEFAULT 'issued',
  notes                 TEXT,
  pdf_url               TEXT,
  generated_at          TIMESTAMPTZ     DEFAULT NOW(),
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_issuer_id    ON invoices(issuer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_recipient_id ON invoices(recipient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status       ON invoices(status);

-- =============================================================
-- TABLE: youtube_channels
-- =============================================================
CREATE TABLE IF NOT EXISTS youtube_channels (
  id                      UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                UUID                  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id              TEXT                  NOT NULL,
  channel_title           TEXT,
  channel_thumbnail       TEXT,
  subscriber_count        INT                   DEFAULT 0,
  video_count             INT                   DEFAULT 0,
  access_token_encrypted  TEXT,
  refresh_token_encrypted TEXT,
  token_status            youtube_token_status  NOT NULL DEFAULT 'valid',
  token_expires_at        TIMESTAMPTZ,
  is_active               BOOLEAN               NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ytc_owner_id   ON youtube_channels(owner_id);
CREATE INDEX IF NOT EXISTS idx_ytc_channel_id ON youtube_channels(channel_id);

-- =============================================================
-- TABLE: event_templates
-- =============================================================
CREATE TABLE IF NOT EXISTS event_templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  thumbnail   TEXT,
  category    TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  sort_order  INT         DEFAULT 0,
  fields      JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- FUNCTION & TRIGGERS: auto-update updated_at
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated_at                BEFORE UPDATE ON users                  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_wallets_updated_at              BEFORE UPDATE ON wallets                FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_user_credits_updated_at         BEFORE UPDATE ON user_credits           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_orders_updated_at               BEFORE UPDATE ON orders                 FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_studio_branding_updated_at      BEFORE UPDATE ON studio_branding        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_payment_gw_configs_updated_at   BEFORE UPDATE ON payment_gateway_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_gst_configurations_updated_at   BEFORE UPDATE ON gst_configurations     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_invoices_updated_at             BEFORE UPDATE ON invoices               FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_refund_requests_updated_at      BEFORE UPDATE ON refund_requests        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_wallet_adjustments_updated_at   BEFORE UPDATE ON wallet_adjustments     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_youtube_channels_updated_at     BEFORE UPDATE ON youtube_channels       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_packages_updated_at             BEFORE UPDATE ON packages               FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================
-- Admin password reset (/admin/forgot-password; stored in Postgres, not Redis)
-- =============================================================
CREATE TABLE IF NOT EXISTS admin_password_reset_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_pwd_reset_user ON admin_password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_pwd_reset_expires ON admin_password_reset_tokens(expires_at);

CREATE TABLE IF NOT EXISTS admin_password_reset_rate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_pwd_rate_ip_created ON admin_password_reset_rate(ip, created_at DESC);

-- =============================================================
-- Event cleanup / instrumentation (cleanup-service, instrumentation.ts)
-- =============================================================
CREATE TABLE IF NOT EXISTS cron_job_logs (
  id UUID PRIMARY KEY,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  deleted_count INT DEFAULT 0,
  error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_started ON cron_job_logs(started_at DESC);

CREATE TABLE IF NOT EXISTS deleted_events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID,
  event_title TEXT,
  owner_email TEXT,
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  studio_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  assets_found INT DEFAULT 0,
  assets_deleted INT DEFAULT 0,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deleted_events_log_at ON deleted_events_log(deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_deleted_events_log_owner ON deleted_events_log(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_events_log_studio ON deleted_events_log(studio_id);

-- =============================================================
-- SEED: Admin user  (password = admin123)
-- =============================================================
INSERT INTO users (id, email, name, phone, password_hash, role, status, email_verified)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@streamlivee.com',
  'Platform Admin',
  '+919999999999',
  crypt('admin123', gen_salt('bf')),
  'admin',
  'active',
  true
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO wallets (user_id, balance, currency)
VALUES ('00000000-0000-0000-0000-000000000001', 0, 'INR')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_credits (user_id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO studio_branding (user_id, platform_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'StreamLivee')
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================
-- SEED: Platform settings
-- =============================================================
INSERT INTO platform_settings (key, value) VALUES
  ('stream_type_pricing', '{"rtmp":{"enabled":true,"basePrice":1500,"label":"RTMP Server","description":"Use OBS/Wirecast","volumeDiscountTiers":[{"minQty":5,"pricePerCredit":1350,"label":"5-Pack (10% off)","enabled":true},{"minQty":10,"pricePerCredit":1200,"label":"10-Pack (20% off)","enabled":true},{"minQty":25,"pricePerCredit":1050,"label":"25-Pack (30% off)","enabled":true},{"minQty":50,"pricePerCredit":900,"label":"50-Pack (40% off)","enabled":true}]},"youtube_api":{"enabled":true,"basePrice":1000,"label":"YouTube API","recommended":true,"description":"Direct broadcast","volumeDiscountTiers":[{"minQty":5,"pricePerCredit":900,"label":"5-Pack (10% off)","enabled":true},{"minQty":10,"pricePerCredit":800,"label":"10-Pack (20% off)","enabled":true},{"minQty":25,"pricePerCredit":700,"label":"25-Pack (30% off)","enabled":true},{"minQty":50,"pricePerCredit":600,"label":"50-Pack (40% off)","enabled":true}]},"youtube_embed":{"enabled":true,"basePrice":500,"label":"YouTube Embed","description":"Embed existing stream","volumeDiscountTiers":[{"minQty":5,"pricePerCredit":450,"label":"5-Pack (10% off)","enabled":true},{"minQty":10,"pricePerCredit":400,"label":"10-Pack (20% off)","enabled":true},{"minQty":25,"pricePerCredit":350,"label":"25-Pack (30% off)","enabled":true}]},"third_party":{"enabled":true,"basePrice":400,"label":"Third Party","description":"External RTMP embed","volumeDiscountTiers":[{"minQty":5,"pricePerCredit":360,"label":"5-Pack (10% off)","enabled":true},{"minQty":10,"pricePerCredit":320,"label":"10-Pack (20% off)","enabled":true}]}}'::jsonb),
  ('validity_extensions', '{"defaultDays":30,"extensions":[{"days":60,"creditCost":1,"label":"60 Days (+1 credit)","enabled":true},{"days":90,"creditCost":2,"label":"90 Days (+2 credits)","enabled":true},{"days":180,"creditCost":5,"label":"180 Days (+5 credits)","enabled":true},{"days":365,"creditCost":12,"label":"365 Days (+12 credits)","enabled":true}]}'::jsonb),
  ('simulcast_pricing', '{"youtube":{"price":75,"enabled":true,"label":"YouTube"},"facebook":{"price":75,"enabled":true,"label":"Facebook"},"custom_rtmp":{"price":100,"enabled":true,"label":"Custom RTMP"}}'::jsonb),
  ('studio_subscription', '{"enabled":true,"annualPrice":1800000,"label":"Studio Annual Subscription","description":"White-label platform access and hosting"}'::jsonb),
  ('gst_config', '{"enabled":true,"percentage":18,"gstin":"","companyName":"StreamLivee","companyAddress":""}'::jsonb),
  ('payment_gateways', '{"razorpay":{"enabled":true,"label":"Razorpay"},"instamojo":{"enabled":true,"label":"Instamojo"}}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- =============================================================
-- SEED: Event templates
-- =============================================================
INSERT INTO event_templates (name, category, is_active, sort_order) VALUES
  ('Basic Live Stream',   'general',       true, 1),
  ('Wedding Live Stream', 'wedding',       true, 2),
  ('Religious Event',     'religious',     true, 3),
  ('Corporate Webinar',   'corporate',     true, 4),
  ('Concert & Music',     'entertainment', true, 5),
  ('Product Launch',      'business',      true, 6),
  ('Sports Event',        'sports',        true, 7),
  ('YouTube Embed',       'youtube',       true, 8),
  ('Third Party Embed',   'third_party',   true, 9)
ON CONFLICT DO NOTHING;

-- =============================================================
-- Done
-- =============================================================
SELECT 'Schema migration complete' AS result,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') AS total_tables,
       (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admin_users,
       (SELECT COUNT(*) FROM platform_settings) AS platform_settings,
       (SELECT COUNT(*) FROM event_templates) AS event_templates;
