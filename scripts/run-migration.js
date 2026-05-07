// Migration script using pg (works with any PostgreSQL)

const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function execSql(client, query) {
  const result = await client.query(query);
  return result;
}

const statements = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
  `CREATE TYPE user_role AS ENUM ('admin', 'studio', 'streamer')`,
  `CREATE TYPE user_status AS ENUM ('active', 'suspended', 'pending', 'deactivated')`,
  `CREATE TYPE event_status AS ENUM ('draft', 'scheduled', 'live', 'ended', 'cancelled')`,
  `CREATE TYPE stream_type_key AS ENUM ('rtmp', 'youtube_api', 'youtube_embed', 'third_party')`,
  `CREATE TYPE order_type AS ENUM ('credit_purchase', 'wallet_recharge', 'validity_extension', 'service_charge', 'studio_upgrade', 'annual_subscription')`,
  `CREATE TYPE order_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled')`,
  `CREATE TYPE payment_gateway AS ENUM ('razorpay', 'instamojo', 'wallet', 'manual')`,
  `CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded')`,
  `CREATE TYPE txn_category AS ENUM ('top_up', 'credit_purchase', 'service_charge', 'order_refund', 'adjustment', 'manual_adjustment', 'payment_recovery', 'compensation', 'correction', 'goodwill', 'ai_image_generation', 'whitelabel_hosting', 'domain_registration', 'studio_upgrade', 'annual_subscription')`,
  `CREATE TYPE refund_status AS ENUM ('pending', 'approved', 'rejected', 'processing', 'completed', 'failed')`,
  `CREATE TYPE refund_type AS ENUM ('event_cancellation', 'payment_failure', 'overcharge', 'service_issue', 'manual')`,
  `CREATE TYPE domain_verification_status AS ENUM ('pending', 'verified', 'failed')`,
  `CREATE TYPE domain_ssl_status AS ENUM ('pending', 'provisioning', 'active', 'failed')`,
  `CREATE TYPE notification_type AS ENUM ('system', 'payment', 'event', 'wallet', 'credit', 'refund', 'approval', 'warning', 'promotional')`,
  `CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'overdue', 'cancelled', 'void')`,
  `CREATE TYPE adjustment_type AS ENUM ('credit', 'debit')`,
  `CREATE TYPE adjustment_category AS ENUM ('goodwill', 'compensation', 'correction', 'manual_top_up', 'manual_debit', 'promotional', 'penalty')`,
  `CREATE TYPE wallet_adjustment_status AS ENUM ('pending', 'approved', 'rejected', 'completed')`,
  `CREATE TYPE youtube_token_status AS ENUM ('valid', 'expired', 'revoked')`,
  `CREATE TABLE users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, phone TEXT, password_hash TEXT NOT NULL, role user_role NOT NULL DEFAULT 'streamer', status user_status NOT NULL DEFAULT 'active', avatar TEXT, theme_preference TEXT NOT NULL DEFAULT 'system', email_verified BOOLEAN NOT NULL DEFAULT false, last_login_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE TABLE sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, token TEXT NOT NULL UNIQUE, ip_address TEXT, user_agent TEXT, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX idx_sessions_token ON sessions(token)`,
  `CREATE INDEX idx_sessions_user_id ON sessions(user_id)`,
  `CREATE INDEX idx_sessions_expires_at ON sessions(expires_at)`,
  `CREATE TABLE wallets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, balance BIGINT NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'INR', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE TABLE wallet_transactions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL CHECK (type IN ('credit', 'debit')), category txn_category NOT NULL, amount BIGINT NOT NULL, balance_before BIGINT NOT NULL, balance_after BIGINT NOT NULL, description TEXT, reference_id TEXT, reference_type TEXT, base_amount BIGINT, gst_amount BIGINT DEFAULT 0, gst_percentage NUMERIC(5,2) DEFAULT 0, total_amount BIGINT, invoice_number TEXT, performed_by UUID REFERENCES users(id), reason TEXT, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX idx_wtxn_wallet ON wallet_transactions(wallet_id)`,
  `CREATE INDEX idx_wtxn_user ON wallet_transactions(user_id)`,
  `CREATE INDEX idx_wtxn_cat ON wallet_transactions(category)`,
  `CREATE INDEX idx_wtxn_created ON wallet_transactions(created_at DESC)`,
  `CREATE INDEX idx_wtxn_ref ON wallet_transactions(reference_id, reference_type)`,
  `CREATE TABLE user_credits (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, rtmp INT NOT NULL DEFAULT 0, youtube_api INT NOT NULL DEFAULT 0, youtube_embed INT NOT NULL DEFAULT 0, third_party INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE TABLE credit_purchases (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, stream_type stream_type_key NOT NULL, quantity INT NOT NULL, price_per_credit BIGINT NOT NULL, total_price BIGINT NOT NULL, discount_tier_label TEXT, wallet_transaction_id UUID REFERENCES wallet_transactions(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX idx_cp_user ON credit_purchases(user_id)`,
  `CREATE TABLE credit_deductions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, stream_type stream_type_key NOT NULL, amount INT NOT NULL DEFAULT 1, reason TEXT NOT NULL, event_id UUID, validity_days INT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX idx_cd_user ON credit_deductions(user_id)`,
  `CREATE TABLE platform_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), key TEXT NOT NULL UNIQUE, value JSONB NOT NULL DEFAULT '{}', updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE TABLE events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, thumbnail TEXT, stream_type stream_type_key NOT NULL, stream_key TEXT, rtmp_url TEXT, hls_url TEXT, youtube_url TEXT, embed_code TEXT, status event_status NOT NULL DEFAULT 'draft', scheduled_at TIMESTAMPTZ, started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ, max_viewers INT DEFAULT 0, current_viewers INT DEFAULT 0, total_views INT DEFAULT 0, is_password_protected BOOLEAN NOT NULL DEFAULT false, event_password TEXT, allow_chat BOOLEAN NOT NULL DEFAULT true, allow_reactions BOOLEAN NOT NULL DEFAULT true, simulcast_config JSONB DEFAULT '[]', template_id UUID, template_data JSONB DEFAULT '{}', validity_expires_at TIMESTAMPTZ, credits_consumed INT DEFAULT 1, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX idx_events_user ON events(user_id)`,
  `ALTER TABLE events ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE`,
  `CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug)`,
  `ALTER TABLE events ADD COLUMN IF NOT EXISTS public_url TEXT`,
  `CREATE INDEX idx_events_status ON events(status)`,
  `CREATE INDEX idx_events_scheduled ON events(scheduled_at)`,
  `CREATE INDEX idx_events_stream ON events(stream_type)`,
  `CREATE TABLE orders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_number TEXT NOT NULL UNIQUE, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, order_type order_type NOT NULL, status order_status NOT NULL DEFAULT 'pending', stream_type stream_type_key, quantity INT, unit_price BIGINT, total_price BIGINT NOT NULL, discount_tier_label TEXT, event_id UUID REFERENCES events(id), validity_days INT, credits_cost INT, service_type TEXT, payment_gateway payment_gateway, payment_id UUID, failure_reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), completed_at TIMESTAMPTZ)`,
  `CREATE INDEX idx_orders_user ON orders(user_id)`,
  `CREATE INDEX idx_orders_status ON orders(status)`,
  `CREATE INDEX idx_orders_number ON orders(order_number)`,
  `CREATE TABLE payments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, order_id UUID REFERENCES orders(id), amount BIGINT NOT NULL, gst_amount BIGINT DEFAULT 0, total_amount BIGINT NOT NULL, gateway payment_gateway NOT NULL, status payment_status NOT NULL DEFAULT 'pending', gateway_order_id TEXT, gateway_payment_id TEXT, gateway_signature TEXT, failure_reason TEXT, metadata JSONB DEFAULT '{}', paid_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX idx_payments_user ON payments(user_id)`,
  `CREATE INDEX idx_payments_gw_order ON payments(gateway_order_id)`,
  `CREATE INDEX idx_payments_status ON payments(status)`,
  `CREATE TABLE payment_gateway_configs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE, gateway payment_gateway NOT NULL, is_enabled BOOLEAN NOT NULL DEFAULT false, is_default BOOLEAN NOT NULL DEFAULT false, config JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id, gateway))`,
  `CREATE TABLE notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, message TEXT NOT NULL, type notification_type NOT NULL DEFAULT 'system', is_read BOOLEAN NOT NULL DEFAULT false, read_at TIMESTAMPTZ, link TEXT, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX idx_notif_user ON notifications(user_id)`,
  `CREATE INDEX idx_notif_unread ON notifications(user_id, is_read)`,
  `CREATE TABLE studio_branding (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, platform_name TEXT NOT NULL DEFAULT 'My Studio', logo TEXT, favicon TEXT, primary_color TEXT DEFAULT '#10b981', secondary_color TEXT DEFAULT '#059669', support_email TEXT, support_phone TEXT, terms_url TEXT, privacy_url TEXT, custom_css TEXT, hero_image TEXT, about_image TEXT, services JSONB DEFAULT '[]', event_types JSONB DEFAULT '[]', stats JSONB DEFAULT '[]', testimonials JSONB DEFAULT '[]', gallery_images JSONB DEFAULT '[]', meta_title TEXT, meta_description TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE TABLE domains (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, domain TEXT NOT NULL UNIQUE, verification_token TEXT, verification_status domain_verification_status NOT NULL DEFAULT 'pending', ssl_status domain_ssl_status NOT NULL DEFAULT 'pending', is_primary BOOLEAN NOT NULL DEFAULT false, verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX idx_domains_user ON domains(user_id)`,
  `CREATE INDEX idx_domains_domain ON domains(domain)`,
  `CREATE TABLE refund_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), type refund_type NOT NULL, event_id UUID REFERENCES events(id), order_id UUID REFERENCES orders(id), credit_purchase_id UUID REFERENCES credit_purchases(id), original_amount BIGINT NOT NULL DEFAULT 0, refund_amount BIGINT NOT NULL DEFAULT 0, gst_amount BIGINT DEFAULT 0, total_refund_amount BIGINT NOT NULL DEFAULT 0, related_transaction_ids TEXT[] DEFAULT ARRAY[]::TEXT[], status refund_status NOT NULL DEFAULT 'pending', requested_by UUID NOT NULL REFERENCES users(id), requested_by_role user_role, requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), approved_by UUID REFERENCES users(id), approved_at TIMESTAMPTZ, rejected_by UUID REFERENCES users(id), rejected_at TIMESTAMPTZ, rejection_reason TEXT, refund_method TEXT, payment_gateway payment_gateway, original_payment_id TEXT, refund_transaction_id UUID REFERENCES wallet_transactions(id), completed_at TIMESTAMPTZ, failure_reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX idx_refund_status ON refund_requests(status)`,
  `CREATE TABLE wallet_adjustments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, target_user_role user_role, type adjustment_type NOT NULL, amount BIGINT NOT NULL, reason TEXT NOT NULL, category adjustment_category NOT NULL, initiated_by UUID NOT NULL REFERENCES users(id), initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), approval_required BOOLEAN NOT NULL DEFAULT false, approved_by UUID REFERENCES users(id), approved_at TIMESTAMPTZ, status wallet_adjustment_status NOT NULL DEFAULT 'completed', transaction_id UUID REFERENCES wallet_transactions(id), notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE TABLE gst_configurations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, gst_enabled BOOLEAN NOT NULL DEFAULT false, gst_percentage NUMERIC(5,2) DEFAULT 18.00, gst_number TEXT, pan_number TEXT, business_name TEXT, business_address TEXT, city TEXT, state TEXT, pincode TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE TABLE invoices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), invoice_number TEXT NOT NULL UNIQUE, invoice_type TEXT NOT NULL DEFAULT 'tax_invoice', issuer_id UUID REFERENCES users(id), issuer_type TEXT, issuer_business_name TEXT, issuer_gst_number TEXT, issuer_address TEXT, recipient_id UUID REFERENCES users(id), recipient_type TEXT, recipient_name TEXT, recipient_email TEXT, base_amount BIGINT NOT NULL DEFAULT 0, gst_percentage NUMERIC(5,2) DEFAULT 0, cgst_amount BIGINT DEFAULT 0, sgst_amount BIGINT DEFAULT 0, igst_amount BIGINT DEFAULT 0, total_gst_amount BIGINT DEFAULT 0, total_amount BIGINT NOT NULL DEFAULT 0, transaction_id UUID REFERENCES wallet_transactions(id), payment_id UUID REFERENCES payments(id), payment_method TEXT, payment_date TIMESTAMPTZ, invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(), due_date TIMESTAMPTZ, status invoice_status NOT NULL DEFAULT 'issued', notes TEXT, pdf_url TEXT, generated_at TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS invoice_sequences (financial_year TEXT PRIMARY KEY, next_number BIGINT NOT NULL DEFAULT 1, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CHECK (next_number > 0))`,
  `CREATE INDEX idx_inv_issuer ON invoices(issuer_id)`,
  `CREATE INDEX idx_inv_recipient ON invoices(recipient_id)`,
  `CREATE TABLE youtube_channels (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, channel_id TEXT NOT NULL, channel_title TEXT, channel_thumbnail TEXT, subscriber_count INT DEFAULT 0, video_count INT DEFAULT 0, access_token_encrypted TEXT, refresh_token_encrypted TEXT, token_status youtube_token_status NOT NULL DEFAULT 'valid', token_expires_at TIMESTAMPTZ, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX idx_ytc_owner ON youtube_channels(owner_id)`,
  `CREATE TABLE event_templates (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, thumbnail TEXT, category TEXT, is_active BOOLEAN NOT NULL DEFAULT true, sort_order INT DEFAULT 0, fields JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  // packages table (and its enum types)
  `CREATE TYPE package_type AS ENUM ('event_pack', 'validity', 'addon', 'pay_per_event')`,
  `CREATE TYPE pricing_model AS ENUM ('fixed', 'tiered', 'per_event', 'custom')`,
  `CREATE TABLE packages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, type package_type NOT NULL DEFAULT 'event_pack', pricing_model pricing_model NOT NULL DEFAULT 'fixed', description TEXT DEFAULT '', price NUMERIC(12,2) NOT NULL DEFAULT 0, base_price_reseller NUMERIC(12,2) DEFAULT 0, base_price_user NUMERIC(12,2) DEFAULT 0, duration INT DEFAULT 30, max_events INT DEFAULT 1, max_concurrent_viewers INT DEFAULT 100, features JSONB DEFAULT '[]', is_active BOOLEAN DEFAULT true, sort_order INT DEFAULT 0, min_qty INT DEFAULT 1, max_qty INT DEFAULT 100, stream_type_pricing JSONB, simulcast_pricing JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX idx_packages_slug ON packages(slug)`,
  `CREATE INDEX idx_packages_active ON packages(is_active)`,
  `CREATE INDEX idx_packages_type ON packages(type)`,
  // Draft events (no stream selected): add enum value (idempotent on PG 10+)
  `ALTER TYPE stream_type_key ADD VALUE IF NOT EXISTS 'pending'`,
  // RTMP provider metadata for managed providers such as 5CentsCDN.
  `ALTER TABLE events ADD COLUMN IF NOT EXISTS rtmp_provider TEXT NOT NULL DEFAULT 'srs', ADD COLUMN IF NOT EXISTS rtmp_provider_stream_id TEXT, ADD COLUMN IF NOT EXISTS rtmp_provider_payload JSONB DEFAULT '{}'::jsonb`,
  `CREATE INDEX IF NOT EXISTS idx_events_rtmp_provider ON events(rtmp_provider)`,
  `CREATE INDEX IF NOT EXISTS idx_events_rtmp_provider_stream_id ON events(rtmp_provider_stream_id)`,
  // Admin forgot-password (PostgreSQL only; no Redis)
  `CREATE TABLE IF NOT EXISTS admin_password_reset_tokens (token TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX IF NOT EXISTS idx_admin_pwd_reset_user ON admin_password_reset_tokens(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_admin_pwd_reset_expires ON admin_password_reset_tokens(expires_at)`,
  `CREATE TABLE IF NOT EXISTS admin_password_reset_rate (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ip TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX IF NOT EXISTS idx_admin_pwd_rate_ip_created ON admin_password_reset_rate(ip, created_at DESC)`,
  // Event cleanup / instrumentation (lib/server/cleanup-service.ts, instrumentation.ts)
  `CREATE TABLE IF NOT EXISTS cron_job_logs (id UUID PRIMARY KEY, status TEXT NOT NULL, started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ended_at TIMESTAMPTZ, deleted_count INT DEFAULT 0, error_message TEXT)`,
  `CREATE INDEX IF NOT EXISTS idx_cron_job_logs_started ON cron_job_logs(started_at DESC)`,
  `CREATE TABLE IF NOT EXISTS deleted_events_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_id UUID, event_title TEXT, owner_email TEXT, reason TEXT, assets_found INT DEFAULT 0, assets_deleted INT DEFAULT 0, deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX IF NOT EXISTS idx_deleted_events_log_at ON deleted_events_log(deleted_at DESC)`,
  `ALTER TABLE events ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES users(id) ON DELETE SET NULL`,
  `CREATE INDEX IF NOT EXISTS idx_events_studio_id ON events(studio_id)`,
  `ALTER TABLE deleted_events_log ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE deleted_events_log ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES users(id) ON DELETE SET NULL`,
  `CREATE INDEX IF NOT EXISTS idx_deleted_events_log_owner ON deleted_events_log(owner_user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_deleted_events_log_studio ON deleted_events_log(studio_id)`,
  `UPDATE deleted_events_log d SET owner_user_id = u.id FROM users u WHERE d.owner_user_id IS NULL AND d.owner_email IS NOT NULL AND lower(trim(d.owner_email)) = lower(trim(u.email))`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_state TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference TEXT NOT NULL DEFAULT 'system'`,
  `ALTER TABLE gst_configurations ADD COLUMN IF NOT EXISTS gst_type TEXT NOT NULL DEFAULT 'individual'`,
  `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recipient_gst_number TEXT`,
  `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recipient_address TEXT`,
  `ALTER TABLE events ADD COLUMN IF NOT EXISTS capture_visitor_data BOOLEAN NOT NULL DEFAULT true`,
  `CREATE TABLE IF NOT EXISTS event_visitor_registrations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE, full_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, ip_address TEXT, user_agent TEXT, accept_language TEXT, referer TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX IF NOT EXISTS idx_evr_event_created ON event_visitor_registrations(event_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_evr_created ON event_visitor_registrations(created_at DESC)`,
  `ALTER TABLE event_visitor_registrations ADD COLUMN IF NOT EXISTS ip_country TEXT`,
  `ALTER TABLE event_visitor_registrations ADD COLUMN IF NOT EXISTS visitor_key TEXT`,
  `ALTER TABLE event_visitor_registrations ADD COLUMN IF NOT EXISTS session_key TEXT`,
  `CREATE TABLE IF NOT EXISTS event_visitor_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE, visitor_key TEXT NOT NULL, session_key TEXT NOT NULL, user_id UUID REFERENCES users(id) ON DELETE SET NULL, is_logged_in BOOLEAN NOT NULL DEFAULT false, full_name TEXT, email TEXT, phone TEXT, ip_address TEXT, user_agent TEXT, accept_language TEXT, referer TEXT, landing_page_url TEXT, utm_source TEXT NOT NULL DEFAULT 'direct', utm_medium TEXT NOT NULL DEFAULT 'none', utm_campaign TEXT, country_code TEXT, first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), duration_seconds INT, context_type TEXT, context_id UUID, CONSTRAINT evs_context_check CHECK (context_type IS NULL OR context_type IN ('platform', 'studio')), CONSTRAINT evs_event_session_unique UNIQUE (event_id, session_key))`,
  `CREATE INDEX IF NOT EXISTS idx_evs_event_first ON event_visitor_sessions(event_id, first_seen_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_evs_event_visitor ON event_visitor_sessions(event_id, visitor_key)`,
  `CREATE INDEX IF NOT EXISTS idx_evs_event_utm ON event_visitor_sessions(event_id, utm_source)`,
  `CREATE TABLE IF NOT EXISTS analytics_funnel_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_type TEXT NOT NULL, visitor_key TEXT NOT NULL, session_key TEXT, user_id UUID REFERENCES users(id) ON DELETE SET NULL, related_event_id UUID REFERENCES events(id) ON DELETE SET NULL, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, context_type TEXT, context_id UUID, payload JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CONSTRAINT afe_context_check CHECK (context_type IS NULL OR context_type IN ('platform', 'studio')))`,
  `CREATE INDEX IF NOT EXISTS idx_afe_type_created ON analytics_funnel_events(event_type, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_afe_visitor ON analytics_funnel_events(visitor_key)`,
  `CREATE INDEX IF NOT EXISTS idx_afe_user ON analytics_funnel_events(user_id) WHERE user_id IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS idx_afe_related_event ON analytics_funnel_events(related_event_id) WHERE related_event_id IS NOT NULL`,
  // Studio setup (POST /api/studio/setup) + dashboard (orders scoped by studio)
  `ALTER TABLE studio_branding ADD COLUMN IF NOT EXISTS tagline TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES users(id) ON DELETE SET NULL`,
  `CREATE INDEX IF NOT EXISTS idx_orders_studio_id ON orders(studio_id)`,
  `ALTER TABLE studio_branding ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ`,
  `UPDATE studio_branding SET setup_completed_at = COALESCE(updated_at, created_at) WHERE setup_completed_at IS NULL AND setup_wizard_draft IS NULL AND support_email IS NOT NULL AND trim(support_email) <> ''`,
];

const seedSettings = [
  { key: "stream_type_pricing", value: {rtmp:{enabled:true,basePrice:1500,label:"RTMP Server",description:"Use OBS/Wirecast",volumeDiscountTiers:[{minQty:5,pricePerCredit:1350,label:"5-Pack (10% off)",enabled:true},{minQty:10,pricePerCredit:1200,label:"10-Pack (20% off)",enabled:true},{minQty:25,pricePerCredit:1050,label:"25-Pack (30% off)",enabled:true},{minQty:50,pricePerCredit:900,label:"50-Pack (40% off)",enabled:true}]},youtube_api:{enabled:true,basePrice:1000,label:"YouTube API",recommended:true,description:"Direct broadcast",volumeDiscountTiers:[{minQty:5,pricePerCredit:900,label:"5-Pack (10% off)",enabled:true},{minQty:10,pricePerCredit:800,label:"10-Pack (20% off)",enabled:true},{minQty:25,pricePerCredit:700,label:"25-Pack (30% off)",enabled:true},{minQty:50,pricePerCredit:600,label:"50-Pack (40% off)",enabled:true}]},youtube_embed:{enabled:true,basePrice:500,label:"YouTube Embed",description:"Embed existing",volumeDiscountTiers:[{minQty:5,pricePerCredit:450,label:"5-Pack (10% off)",enabled:true},{minQty:10,pricePerCredit:400,label:"10-Pack (20% off)",enabled:true},{minQty:25,pricePerCredit:350,label:"25-Pack (30% off)",enabled:true}]},third_party:{enabled:true,basePrice:400,label:"Third Party",description:"External embed",volumeDiscountTiers:[{minQty:5,pricePerCredit:360,label:"5-Pack (10% off)",enabled:true},{minQty:10,pricePerCredit:320,label:"10-Pack (20% off)",enabled:true}]}} },
  { key: "validity_extensions", value: {defaultDays:30,extensions:[{days:60,creditCost:1,label:"60 Days (+1 credit)",enabled:true},{days:90,creditCost:2,label:"90 Days (+2 credits)",enabled:true},{days:180,creditCost:5,label:"180 Days (+5 credits)",enabled:true},{days:365,creditCost:12,label:"365 Days (+12 credits)",enabled:true}]} },
  { key: "simulcast_pricing", value: {youtube:{price:75,enabled:true,label:"YouTube"},facebook:{price:75,enabled:true,label:"Facebook"},custom_rtmp:{price:100,enabled:true,label:"Custom RTMP"}} },
  { key: "studio_subscription", value: {enabled:true,annualPrice:1800000,label:"Studio Annual Subscription",description:"White-label platform access and hosting"} },
  { key: "gst_config", value: {enabled:true,percentage:18,gstin:"",companyName:"StreamLivee",companyAddress:""} },
  { key: "payment_gateways", value: {razorpay:{enabled:true,label:"Razorpay"},instamojo:{enabled:true,label:"Instamojo"}} },
  { key: "platform_domain", value: "" },
  { key: "platform_cname_target", value: "" },
];

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const exec = (q) => execSql(client, q);

  console.log("Starting migration (pg)...");
  let ok = 0, skip = 0, fail = 0;

  for (let i = 0; i < statements.length; i++) {
    try {
      await exec(statements[i]);
      ok++;
      if (i % 10 === 0) console.log(`Progress: ${i+1}/${statements.length}`);
    } catch (err) {
      const msg = err?.message || String(err);
      if (msg.includes("already exists")) {
        skip++;
      } else {
        fail++;
        console.error(`[${i}] FAIL: ${msg.substring(0, 150)}`);
      }
    }
  }
  console.log(`Schema: ${ok} ok, ${skip} skipped, ${fail} failed`);

  console.log("Creating triggers...");
  await exec(`CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $f$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $f$ LANGUAGE plpgsql`);
  const triggerTables = ["users","wallets","user_credits","orders","studio_branding","payment_gateway_configs","gst_configurations","invoices","refund_requests","wallet_adjustments","youtube_channels"];
  for (const t of triggerTables) {
    const tname = `trg_${t.replace(/_/g,"")}_upd`;
    try {
      await exec(`DROP TRIGGER IF EXISTS ${tname} ON ${t}`);
      await exec(`CREATE TRIGGER ${tname} BEFORE UPDATE ON ${t} FOR EACH ROW EXECUTE FUNCTION update_updated_at()`);
    } catch (e) {
      console.error(`Trigger ${t}:`, e?.message?.substring(0, 80));
    }
  }
  console.log("Triggers done");

  console.log("Skipping legacy SQL admin seed (password format did not match app login).");
  console.log("Create admin with: node --env-file=.env.production scripts/seed-production-admin.js");

  // Insert defaults only when the key is missing. Do NOT overwrite existing rows —
  // DO UPDATE would reset admin-configured pricing, GST, gateways, etc. on every run.
  console.log("Seeding settings (missing keys only)...");
  for (const s of seedSettings) {
    try {
      const val = JSON.stringify(s.value).replace(/'/g, "''");
      await exec(`INSERT INTO platform_settings (key, value) VALUES ('${s.key}', '${val}'::jsonb) ON CONFLICT (key) DO NOTHING`);
    } catch (e) {
      console.error(`Setting ${s.key}:`, e?.message?.substring(0, 100));
    }
  }
  console.log("Settings seeded");
  await client.end();
  console.log("MIGRATION COMPLETE!");
}

run().catch((e) => { console.error("Fatal:", e); process.exit(1); });
