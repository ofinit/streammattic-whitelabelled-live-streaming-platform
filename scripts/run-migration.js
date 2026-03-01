import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

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
  `CREATE TABLE users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, phone TEXT, password_hash TEXT NOT NULL, role user_role NOT NULL DEFAULT 'streamer', status user_status NOT NULL DEFAULT 'active', avatar TEXT, email_verified BOOLEAN NOT NULL DEFAULT false, last_login_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
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
  `CREATE TABLE refund_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), type refund_type NOT NULL, event_id UUID REFERENCES events(id), order_id UUID REFERENCES orders(id), credit_purchase_id UUID REFERENCES credit_purchases(id), original_amount BIGINT NOT NULL DEFAULT 0, refund_amount BIGINT NOT NULL DEFAULT 0, gst_amount BIGINT DEFAULT 0, total_refund_amount BIGINT NOT NULL DEFAULT 0, related_transaction_ids TEXT[] DEFAULT '{}', status refund_status NOT NULL DEFAULT 'pending', requested_by UUID NOT NULL REFERENCES users(id), requested_by_role user_role, requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), approved_by UUID REFERENCES users(id), approved_at TIMESTAMPTZ, rejected_by UUID REFERENCES users(id), rejected_at TIMESTAMPTZ, rejection_reason TEXT, refund_method TEXT, payment_gateway payment_gateway, original_payment_id TEXT, refund_transaction_id UUID REFERENCES wallet_transactions(id), completed_at TIMESTAMPTZ, failure_reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX idx_refund_status ON refund_requests(status)`,
  `CREATE TABLE wallet_adjustments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, target_user_role user_role, type adjustment_type NOT NULL, amount BIGINT NOT NULL, reason TEXT NOT NULL, category adjustment_category NOT NULL, initiated_by UUID NOT NULL REFERENCES users(id), initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), approval_required BOOLEAN NOT NULL DEFAULT false, approved_by UUID REFERENCES users(id), approved_at TIMESTAMPTZ, status wallet_adjustment_status NOT NULL DEFAULT 'completed', transaction_id UUID REFERENCES wallet_transactions(id), notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE TABLE gst_configurations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, gst_enabled BOOLEAN NOT NULL DEFAULT false, gst_percentage NUMERIC(5,2) DEFAULT 18.00, gst_number TEXT, pan_number TEXT, business_name TEXT, business_address TEXT, city TEXT, state TEXT, pincode TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE TABLE invoices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), invoice_number TEXT NOT NULL UNIQUE, invoice_type TEXT NOT NULL DEFAULT 'tax_invoice', issuer_id UUID REFERENCES users(id), issuer_type TEXT, issuer_business_name TEXT, issuer_gst_number TEXT, issuer_address TEXT, recipient_id UUID REFERENCES users(id), recipient_type TEXT, recipient_name TEXT, recipient_email TEXT, base_amount BIGINT NOT NULL DEFAULT 0, gst_percentage NUMERIC(5,2) DEFAULT 0, cgst_amount BIGINT DEFAULT 0, sgst_amount BIGINT DEFAULT 0, igst_amount BIGINT DEFAULT 0, total_gst_amount BIGINT DEFAULT 0, total_amount BIGINT NOT NULL DEFAULT 0, transaction_id UUID REFERENCES wallet_transactions(id), payment_id UUID REFERENCES payments(id), payment_method TEXT, payment_date TIMESTAMPTZ, invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(), due_date TIMESTAMPTZ, status invoice_status NOT NULL DEFAULT 'issued', notes TEXT, pdf_url TEXT, generated_at TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX idx_inv_issuer ON invoices(issuer_id)`,
  `CREATE INDEX idx_inv_recipient ON invoices(recipient_id)`,
  `CREATE TABLE youtube_channels (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, channel_id TEXT NOT NULL, channel_title TEXT, channel_thumbnail TEXT, subscriber_count INT DEFAULT 0, video_count INT DEFAULT 0, access_token_encrypted TEXT, refresh_token_encrypted TEXT, token_status youtube_token_status NOT NULL DEFAULT 'valid', token_expires_at TIMESTAMPTZ, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX idx_ytc_owner ON youtube_channels(owner_id)`,
  `CREATE TABLE event_templates (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, thumbnail TEXT, category TEXT, is_active BOOLEAN NOT NULL DEFAULT true, sort_order INT DEFAULT 0, fields JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
];

async function run() {
  console.log("Starting schema migration...");
  let ok = 0, skip = 0, fail = 0;

  for (let i = 0; i < statements.length; i++) {
    try {
      await sql(statements[i]);
      ok++;
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("already exists")) {
        skip++;
      } else {
        fail++;
        console.error(`[${i}] ${msg}`);
      }
    }
  }
  console.log(`Schema: ${ok} ok, ${skip} skipped, ${fail} failed`);

  // Triggers
  const triggers = [
    `CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql`,
    `CREATE TRIGGER trg_users_upd BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,
    `CREATE TRIGGER trg_wallets_upd BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,
    `CREATE TRIGGER trg_credits_upd BEFORE UPDATE ON user_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,
    `CREATE TRIGGER trg_orders_upd BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,
    `CREATE TRIGGER trg_branding_upd BEFORE UPDATE ON studio_branding FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,
    `CREATE TRIGGER trg_gwconfig_upd BEFORE UPDATE ON payment_gateway_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,
    `CREATE TRIGGER trg_gst_upd BEFORE UPDATE ON gst_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,
    `CREATE TRIGGER trg_invoices_upd BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,
    `CREATE TRIGGER trg_refunds_upd BEFORE UPDATE ON refund_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,
    `CREATE TRIGGER trg_adj_upd BEFORE UPDATE ON wallet_adjustments FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,
    `CREATE TRIGGER trg_ytc_upd BEFORE UPDATE ON youtube_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,
  ];

  for (const t of triggers) {
    try { await sql(t); } catch (e) {
      if (!e.message?.includes("already exists")) console.error("Trigger:", e.message);
    }
  }
  console.log("Triggers created");

  // Seed data
  console.log("Seeding...");
  try {
    const adminCheck = await sql`SELECT id FROM users WHERE email = 'admin@streammattic.com'`;
    if (adminCheck.length === 0) {
      await sql`INSERT INTO users (id, email, name, phone, password_hash, role, status, email_verified) VALUES ('00000000-0000-0000-0000-000000000001', 'admin@streammattic.com', 'Platform Admin', '+919999999999', crypt('admin123', gen_salt('bf')), 'admin', 'active', true)`;
      await sql`INSERT INTO wallets (user_id, balance, currency) VALUES ('00000000-0000-0000-0000-000000000001', 0, 'INR')`;
      await sql`INSERT INTO user_credits (user_id) VALUES ('00000000-0000-0000-0000-000000000001')`;
      console.log("Admin user created");
    } else {
      console.log("Admin already exists");
    }
  } catch (e) {
    console.error("Admin seed error:", e.message);
  }

  // Platform settings
  const settings = [
    ["stream_type_pricing", JSON.stringify({rtmp:{enabled:true,basePrice:1500,label:"RTMP Server",description:"Use OBS/Wirecast",volumeDiscountTiers:[{minQty:5,pricePerCredit:1350,label:"5-Pack (10% off)",enabled:true},{minQty:10,pricePerCredit:1200,label:"10-Pack (20% off)",enabled:true},{minQty:25,pricePerCredit:1050,label:"25-Pack (30% off)",enabled:true},{minQty:50,pricePerCredit:900,label:"50-Pack (40% off)",enabled:true}]},youtube_api:{enabled:true,basePrice:1000,label:"YouTube API",recommended:true,description:"Direct broadcast",volumeDiscountTiers:[{minQty:5,pricePerCredit:900,label:"5-Pack (10% off)",enabled:true},{minQty:10,pricePerCredit:800,label:"10-Pack (20% off)",enabled:true},{minQty:25,pricePerCredit:700,label:"25-Pack (30% off)",enabled:true},{minQty:50,pricePerCredit:600,label:"50-Pack (40% off)",enabled:true}]},youtube_embed:{enabled:true,basePrice:500,label:"YouTube Embed",description:"Embed existing",volumeDiscountTiers:[{minQty:5,pricePerCredit:450,label:"5-Pack (10% off)",enabled:true},{minQty:10,pricePerCredit:400,label:"10-Pack (20% off)",enabled:true},{minQty:25,pricePerCredit:350,label:"25-Pack (30% off)",enabled:true}]},third_party:{enabled:true,basePrice:400,label:"Third Party",description:"External embed",volumeDiscountTiers:[{minQty:5,pricePerCredit:360,label:"5-Pack (10% off)",enabled:true},{minQty:10,pricePerCredit:320,label:"10-Pack (20% off)",enabled:true}]}})],
    ["validity_extensions", JSON.stringify({defaultDays:30,extensions:[{days:60,creditCost:1,label:"60 Days (+1 credit)",enabled:true},{days:90,creditCost:2,label:"90 Days (+2 credits)",enabled:true},{days:180,creditCost:4,label:"180 Days (+4 credits)",enabled:true},{days:365,creditCost:8,label:"365 Days (+8 credits)",enabled:true}]})],
    ["simulcast_pricing", JSON.stringify({youtube:{price:75,enabled:true,label:"YouTube"},facebook:{price:75,enabled:true,label:"Facebook"},custom_rtmp:{price:100,enabled:true,label:"Custom RTMP"}})],
    ["studio_subscription", JSON.stringify({enabled:true,annualPrice:1800000,label:"Studio Annual Subscription",description:"White-label platform access and hosting"})],
    ["gst_config", JSON.stringify({enabled:true,percentage:18,gstin:"",companyName:"StreamMattic",companyAddress:""})],
    ["payment_gateways", JSON.stringify({razorpay:{enabled:true,label:"Razorpay"},instamojo:{enabled:true,label:"Instamojo"}})]
  ];

  for (const [key, val] of settings) {
    try {
      await sql`INSERT INTO platform_settings (key, value) VALUES (${key}, ${val}::jsonb) ON CONFLICT (key) DO UPDATE SET value = ${val}::jsonb, updated_at = NOW()`;
    } catch (e) {
      console.error(`Setting ${key}:`, e.message);
    }
  }
  console.log("Settings seeded:", settings.length);
  console.log("DONE!");
}

run().catch(e => { console.error("Fatal:", e); process.exit(1); });
