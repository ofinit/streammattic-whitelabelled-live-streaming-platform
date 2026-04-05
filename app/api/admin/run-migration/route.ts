/**
 * POST /api/admin/run-migration
 * 
 * One-shot migration endpoint – executes the complete schema migration
 * directly from the deployed server where DATABASE_URL is available.
 * 
 * Protected by MIGRATION_SECRET env var.
 * After first successful run you should remove or disable this route.
 * 
 * Usage:
 *   curl -X POST https://your-domain.com/api/admin/run-migration \
 *     -H "x-migration-secret: YOUR_SECRET" \
 *     -H "Content-Type: application/json"
 */

import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export const runtime = "nodejs"
export const maxDuration = 300 // 5 minutes

const MIGRATION_SECRET = process.env.MIGRATION_SECRET

export async function POST(req: Request) {
  // Auth guard
  const secret = req.headers.get("x-migration-secret")
  if (!MIGRATION_SECRET || secret !== MIGRATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sql = getDb()
  const results: Array<{ step: string; status: "ok" | "skip" | "fail"; message?: string }> = []

  async function tryExec(label: string, query: string) {
    try {
      await sql(query, [])
      results.push({ step: label, status: "ok" })
    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : String(err)).trim()
      if (msg.includes("already exists") || msg.includes("duplicate")) {
        results.push({ step: label, status: "skip" })
      } else {
        results.push({ step: label, status: "fail", message: msg.substring(0, 300) })
      }
    }
  }

  // Extensions
  await tryExec("pgcrypto", `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)
  await tryExec("uuid-ossp", `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)

  // ENUMs
  const enums = [
    ["user_role", `CREATE TYPE user_role AS ENUM ('admin','studio','streamer')`],
    ["user_status", `CREATE TYPE user_status AS ENUM ('active','suspended','pending','deactivated')`],
    ["event_status", `CREATE TYPE event_status AS ENUM ('draft','scheduled','live','ended','cancelled')`],
    ["stream_type_key", `CREATE TYPE stream_type_key AS ENUM ('rtmp','youtube_api','youtube_embed','third_party')`],
    ["order_type", `CREATE TYPE order_type AS ENUM ('credit_purchase','wallet_recharge','validity_extension','service_charge','studio_upgrade','annual_subscription')`],
    ["order_status", `CREATE TYPE order_status AS ENUM ('pending','completed','failed','refunded','cancelled')`],
    ["payment_gateway", `CREATE TYPE payment_gateway AS ENUM ('razorpay','instamojo','wallet','manual')`],
    ["payment_status", `CREATE TYPE payment_status AS ENUM ('pending','processing','completed','failed','refunded')`],
    ["txn_category", `CREATE TYPE txn_category AS ENUM ('top_up','credit_purchase','service_charge','order_refund','adjustment','manual_adjustment','payment_recovery','compensation','correction','goodwill','ai_image_generation','whitelabel_hosting','domain_registration','studio_upgrade','annual_subscription')`],
    ["refund_status", `CREATE TYPE refund_status AS ENUM ('pending','approved','rejected','processing','completed','failed')`],
    ["refund_type", `CREATE TYPE refund_type AS ENUM ('event_cancellation','payment_failure','overcharge','service_issue','manual')`],
    ["domain_verification_status", `CREATE TYPE domain_verification_status AS ENUM ('pending','verified','failed')`],
    ["domain_ssl_status", `CREATE TYPE domain_ssl_status AS ENUM ('pending','provisioning','active','failed')`],
    ["notification_type", `CREATE TYPE notification_type AS ENUM ('system','payment','event','wallet','credit','refund','approval','warning','promotional')`],
    ["invoice_status", `CREATE TYPE invoice_status AS ENUM ('draft','issued','paid','overdue','cancelled','void')`],
    ["adjustment_type", `CREATE TYPE adjustment_type AS ENUM ('credit','debit')`],
    ["adjustment_category", `CREATE TYPE adjustment_category AS ENUM ('goodwill','compensation','correction','manual_top_up','manual_debit','promotional','penalty')`],
    ["wallet_adjustment_status", `CREATE TYPE wallet_adjustment_status AS ENUM ('pending','approved','rejected','completed')`],
    ["youtube_token_status", `CREATE TYPE youtube_token_status AS ENUM ('valid','expired','revoked')`],
    ["package_type", `CREATE TYPE package_type AS ENUM ('event_pack','validity','addon','pay_per_event')`],
    ["pricing_model", `CREATE TYPE pricing_model AS ENUM ('fixed','tiered','per_event','custom')`],
  ]
  for (const [name, stmt] of enums) {
    await tryExec(`ENUM ${name}`, stmt as string)
  }

  // Tables
  const tables: [string, string][] = [
    ["TABLE users", `CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, phone TEXT, password_hash TEXT NOT NULL, role user_role NOT NULL DEFAULT 'streamer', status user_status NOT NULL DEFAULT 'active', avatar TEXT, email_verified BOOLEAN NOT NULL DEFAULT false, last_login_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["IDX users_email", `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`],
    ["IDX users_role", `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`],
    ["TABLE sessions", `CREATE TABLE IF NOT EXISTS sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, token TEXT NOT NULL UNIQUE, ip_address TEXT, user_agent TEXT, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["IDX sessions_token", `CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`],
    ["IDX sessions_user_id", `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`],
    ["IDX sessions_expires_at", `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`],
    ["TABLE login_sessions", `CREATE TABLE IF NOT EXISTS login_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved')), user_id UUID REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), expires_at TIMESTAMPTZ NOT NULL)`],
    ["IDX login_sessions_email", `CREATE INDEX IF NOT EXISTS idx_login_sessions_email ON login_sessions(email)`],
    ["IDX login_sessions_expires_at", `CREATE INDEX IF NOT EXISTS idx_login_sessions_expires_at ON login_sessions(expires_at)`],
    ["TABLE wallets", `CREATE TABLE IF NOT EXISTS wallets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, balance BIGINT NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'INR', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["TABLE wallet_transactions", `CREATE TABLE IF NOT EXISTS wallet_transactions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL CHECK (type IN ('credit','debit')), category txn_category NOT NULL, amount BIGINT NOT NULL, balance_before BIGINT NOT NULL, balance_after BIGINT NOT NULL, description TEXT, reference_id TEXT, reference_type TEXT, base_amount BIGINT, gst_amount BIGINT DEFAULT 0, gst_percentage NUMERIC(5,2) DEFAULT 0, total_amount BIGINT, invoice_number TEXT, performed_by UUID REFERENCES users(id), reason TEXT, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["IDX wtxn_wallet_id", `CREATE INDEX IF NOT EXISTS idx_wtxn_wallet_id ON wallet_transactions(wallet_id)`],
    ["IDX wtxn_user_id", `CREATE INDEX IF NOT EXISTS idx_wtxn_user_id ON wallet_transactions(user_id)`],
    ["IDX wtxn_category", `CREATE INDEX IF NOT EXISTS idx_wtxn_category ON wallet_transactions(category)`],
    ["TABLE user_credits", `CREATE TABLE IF NOT EXISTS user_credits (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, rtmp INT NOT NULL DEFAULT 0, youtube_api INT NOT NULL DEFAULT 0, youtube_embed INT NOT NULL DEFAULT 0, third_party INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["TABLE credit_purchases", `CREATE TABLE IF NOT EXISTS credit_purchases (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, stream_type stream_type_key NOT NULL, quantity INT NOT NULL, price_per_credit BIGINT NOT NULL, total_price BIGINT NOT NULL, discount_tier_label TEXT, wallet_transaction_id UUID REFERENCES wallet_transactions(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["IDX cp_user_id", `CREATE INDEX IF NOT EXISTS idx_cp_user_id ON credit_purchases(user_id)`],
    ["TABLE credit_deductions", `CREATE TABLE IF NOT EXISTS credit_deductions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, stream_type stream_type_key NOT NULL, amount INT NOT NULL DEFAULT 1, reason TEXT NOT NULL, event_id UUID, validity_days INT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["IDX cd_user_id", `CREATE INDEX IF NOT EXISTS idx_cd_user_id ON credit_deductions(user_id)`],
    ["TABLE platform_settings", `CREATE TABLE IF NOT EXISTS platform_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), key TEXT NOT NULL UNIQUE, value JSONB NOT NULL DEFAULT '{}', updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["TABLE packages", `CREATE TABLE IF NOT EXISTS packages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, type package_type NOT NULL DEFAULT 'event_pack', pricing_model pricing_model NOT NULL DEFAULT 'fixed', description TEXT DEFAULT '', price NUMERIC(12,2) NOT NULL DEFAULT 0, base_price_reseller NUMERIC(12,2) DEFAULT 0, base_price_user NUMERIC(12,2) DEFAULT 0, duration INT DEFAULT 30, max_events INT DEFAULT 1, max_concurrent_viewers INT DEFAULT 100, features JSONB DEFAULT '[]', is_active BOOLEAN DEFAULT true, sort_order INT DEFAULT 0, min_qty INT DEFAULT 1, max_qty INT DEFAULT 100, stream_type_pricing JSONB, simulcast_pricing JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["IDX packages_slug", `CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug)`],
    ["TABLE events", `CREATE TABLE IF NOT EXISTS events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, subtitle TEXT, description TEXT, thumbnail TEXT, stream_type stream_type_key NOT NULL, stream_key TEXT, rtmp_url TEXT, hls_url TEXT, youtube_url TEXT, youtube_channel_name TEXT, youtube_broadcast_id TEXT, youtube_stream_id TEXT, embed_code TEXT, status event_status NOT NULL DEFAULT 'draft', scheduled_at TIMESTAMPTZ, started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ, max_viewers INT DEFAULT 0, current_viewers INT DEFAULT 0, total_views INT DEFAULT 0, is_password_protected BOOLEAN NOT NULL DEFAULT false, event_password TEXT, allow_chat BOOLEAN NOT NULL DEFAULT true, allow_reactions BOOLEAN NOT NULL DEFAULT true, simulcast_config JSONB DEFAULT '[]', template_id UUID, template_data JSONB DEFAULT '{}', validity_expires_at TIMESTAMPTZ, hero_image_url TEXT, player_image_url TEXT, photo_gallery_urls JSONB DEFAULT '[]', photographer_logo_url TEXT, photographer_contact JSONB DEFAULT '{}', crew_pin_hash TEXT, credits_consumed INT DEFAULT 1, slug TEXT UNIQUE, credit_deduction_id UUID REFERENCES credit_deductions(id), use_custom_domain BOOLEAN DEFAULT false, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["IDX events_user_id", `CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id)`],
    ["IDX events_status", `CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)`],
    ["IDX events_slug", `CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug)`],
    ["TABLE orders", `CREATE TABLE IF NOT EXISTS orders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_number TEXT NOT NULL UNIQUE, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, order_type order_type NOT NULL, status order_status NOT NULL DEFAULT 'pending', stream_type stream_type_key, quantity INT, unit_price BIGINT, total_price BIGINT NOT NULL, discount_tier_label TEXT, event_id UUID REFERENCES events(id), validity_days INT, credits_cost INT, service_type TEXT, payment_gateway payment_gateway, payment_id UUID, failure_reason TEXT, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), completed_at TIMESTAMPTZ)`],
    ["IDX orders_user_id", `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`],
    ["IDX orders_status", `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`],
    ["IDX orders_order_number", `CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)`],
    ["TABLE payments", `CREATE TABLE IF NOT EXISTS payments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, order_id UUID REFERENCES orders(id), amount BIGINT NOT NULL, gst_amount BIGINT DEFAULT 0, total_amount BIGINT NOT NULL, gateway payment_gateway NOT NULL, status payment_status NOT NULL DEFAULT 'pending', gateway_order_id TEXT, gateway_payment_id TEXT, gateway_signature TEXT, failure_reason TEXT, metadata JSONB DEFAULT '{}', paid_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["IDX payments_user_id", `CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)`],
    ["IDX payments_gateway_order_id", `CREATE INDEX IF NOT EXISTS idx_payments_gateway_order_id ON payments(gateway_order_id)`],
    ["TABLE payment_gateway_configs", `CREATE TABLE IF NOT EXISTS payment_gateway_configs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE, gateway payment_gateway NOT NULL, is_enabled BOOLEAN NOT NULL DEFAULT false, is_default BOOLEAN NOT NULL DEFAULT false, config JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id, gateway))`],
    ["TABLE studio_branding", `CREATE TABLE IF NOT EXISTS studio_branding (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, platform_name TEXT NOT NULL DEFAULT 'My Studio', logo TEXT, favicon TEXT, primary_color TEXT DEFAULT '#10b981', secondary_color TEXT DEFAULT '#059669', support_email TEXT, support_phone TEXT, terms_url TEXT, privacy_url TEXT, custom_css TEXT, hero_image TEXT, about_image TEXT, services JSONB DEFAULT '[]', event_types JSONB DEFAULT '[]', stats JSONB DEFAULT '[]', testimonials JSONB DEFAULT '[]', gallery_images JSONB DEFAULT '[]', meta_title TEXT, meta_description TEXT, company_logo_dark TEXT, whatsapp TEXT, address TEXT, facebook_url TEXT, instagram_url TEXT, twitter_url TEXT, youtube_url TEXT, linkedin_url TEXT, google_analytics_id TEXT, about_us TEXT, terms_conditions TEXT, privacy_policy TEXT, refund_policy TEXT, preferred_gateway TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["TABLE domains", `CREATE TABLE IF NOT EXISTS domains (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, domain TEXT NOT NULL UNIQUE, verification_token TEXT, verification_status domain_verification_status NOT NULL DEFAULT 'pending', ssl_status domain_ssl_status NOT NULL DEFAULT 'pending', is_primary BOOLEAN NOT NULL DEFAULT false, dns_configured_via TEXT, cf_record_ids JSONB DEFAULT '[]', verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["IDX domains_domain", `CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain)`],
    ["TABLE notifications", `CREATE TABLE IF NOT EXISTS notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, message TEXT NOT NULL, type notification_type NOT NULL DEFAULT 'system', is_read BOOLEAN NOT NULL DEFAULT false, read_at TIMESTAMPTZ, link TEXT, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["IDX notifications_user_id", `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`],
    ["TABLE refund_requests", `CREATE TABLE IF NOT EXISTS refund_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), type refund_type NOT NULL, event_id UUID REFERENCES events(id), order_id UUID REFERENCES orders(id), credit_purchase_id UUID REFERENCES credit_purchases(id), original_amount BIGINT NOT NULL DEFAULT 0, refund_amount BIGINT NOT NULL DEFAULT 0, gst_amount BIGINT DEFAULT 0, total_refund_amount BIGINT NOT NULL DEFAULT 0, related_transaction_ids TEXT[] DEFAULT ARRAY[]::TEXT[], status refund_status NOT NULL DEFAULT 'pending', requested_by UUID NOT NULL REFERENCES users(id), requested_by_role user_role, requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), approved_by UUID REFERENCES users(id), approved_at TIMESTAMPTZ, rejected_by UUID REFERENCES users(id), rejected_at TIMESTAMPTZ, rejection_reason TEXT, refund_method TEXT, payment_gateway payment_gateway, original_payment_id TEXT, refund_transaction_id UUID REFERENCES wallet_transactions(id), completed_at TIMESTAMPTZ, failure_reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["IDX refund_status", `CREATE INDEX IF NOT EXISTS idx_refund_status ON refund_requests(status)`],
    ["TABLE wallet_adjustments", `CREATE TABLE IF NOT EXISTS wallet_adjustments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, target_user_role user_role, type adjustment_type NOT NULL, amount BIGINT NOT NULL, reason TEXT NOT NULL, category adjustment_category NOT NULL, initiated_by UUID NOT NULL REFERENCES users(id), initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), approval_required BOOLEAN NOT NULL DEFAULT false, approved_by UUID REFERENCES users(id), approved_at TIMESTAMPTZ, status wallet_adjustment_status NOT NULL DEFAULT 'completed', transaction_id UUID REFERENCES wallet_transactions(id), notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["TABLE gst_configurations", `CREATE TABLE IF NOT EXISTS gst_configurations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, gst_enabled BOOLEAN NOT NULL DEFAULT false, gst_percentage NUMERIC(5,2) DEFAULT 18.00, gst_number TEXT, pan_number TEXT, business_name TEXT, business_address TEXT, city TEXT, state TEXT, pincode TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["TABLE invoices", `CREATE TABLE IF NOT EXISTS invoices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), invoice_number TEXT NOT NULL UNIQUE, invoice_type TEXT NOT NULL DEFAULT 'tax_invoice', issuer_id UUID REFERENCES users(id), issuer_type TEXT, issuer_business_name TEXT, issuer_gst_number TEXT, issuer_address TEXT, recipient_id UUID REFERENCES users(id), recipient_type TEXT, recipient_name TEXT, recipient_email TEXT, base_amount BIGINT NOT NULL DEFAULT 0, gst_percentage NUMERIC(5,2) DEFAULT 0, cgst_amount BIGINT DEFAULT 0, sgst_amount BIGINT DEFAULT 0, igst_amount BIGINT DEFAULT 0, total_gst_amount BIGINT DEFAULT 0, total_amount BIGINT NOT NULL DEFAULT 0, transaction_id UUID REFERENCES wallet_transactions(id), payment_id UUID REFERENCES payments(id), payment_method TEXT, payment_date TIMESTAMPTZ, invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(), due_date TIMESTAMPTZ, status invoice_status NOT NULL DEFAULT 'issued', notes TEXT, pdf_url TEXT, generated_at TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["IDX invoices_issuer_id", `CREATE INDEX IF NOT EXISTS idx_invoices_issuer_id ON invoices(issuer_id)`],
    ["IDX invoices_recipient_id", `CREATE INDEX IF NOT EXISTS idx_invoices_recipient_id ON invoices(recipient_id)`],
    ["TABLE youtube_channels", `CREATE TABLE IF NOT EXISTS youtube_channels (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, channel_id TEXT NOT NULL, channel_title TEXT, channel_thumbnail TEXT, subscriber_count INT DEFAULT 0, video_count INT DEFAULT 0, access_token_encrypted TEXT, refresh_token_encrypted TEXT, token_status youtube_token_status NOT NULL DEFAULT 'valid', token_expires_at TIMESTAMPTZ, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
    ["IDX ytc_owner_id", `CREATE INDEX IF NOT EXISTS idx_ytc_owner_id ON youtube_channels(owner_id)`],
    ["TABLE event_templates", `CREATE TABLE IF NOT EXISTS event_templates (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, thumbnail TEXT, category TEXT, is_active BOOLEAN NOT NULL DEFAULT true, sort_order INT DEFAULT 0, fields JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`],
  ]

  for (const [label, stmt] of tables) {
    await tryExec(label, stmt)
  }

  // Trigger function
  await tryExec("FUNCTION update_updated_at", `
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql
  `)

  const triggerTables = ["users","wallets","user_credits","orders","studio_branding","payment_gateway_configs","gst_configurations","invoices","refund_requests","wallet_adjustments","youtube_channels","packages"]
  for (const t of triggerTables) {
    const tname = `trg_${t}_updated_at`
    await tryExec(`TRIGGER ${tname}`, `
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = '${tname}') THEN
          CREATE TRIGGER ${tname} BEFORE UPDATE ON ${t} FOR EACH ROW EXECUTE FUNCTION update_updated_at();
        END IF;
      END $$
    `)
  }

  // Seed admin
  await tryExec("SEED admin user", `
    INSERT INTO users (id,email,name,phone,password_hash,role,status,email_verified)
    VALUES ('00000000-0000-0000-0000-000000000001','admin@streamlivee.com','Platform Admin','+919999999999',crypt('admin123',gen_salt('bf')),'admin','active',true)
    ON CONFLICT (email) DO NOTHING
  `)
  await tryExec("SEED admin wallet", `INSERT INTO wallets (user_id,balance,currency) VALUES ('00000000-0000-0000-0000-000000000001',0,'INR') ON CONFLICT (user_id) DO NOTHING`)
  await tryExec("SEED admin credits", `INSERT INTO user_credits (user_id) VALUES ('00000000-0000-0000-0000-000000000001') ON CONFLICT (user_id) DO NOTHING`)
  await tryExec("SEED admin branding", `INSERT INTO studio_branding (user_id,platform_name) VALUES ('00000000-0000-0000-0000-000000000001','StreamLivee') ON CONFLICT (user_id) DO NOTHING`)

  // Seed settings
  const settings = [
    ["stream_type_pricing", { rtmp:{enabled:true,basePrice:1500,label:"RTMP Server",description:"Use OBS/Wirecast",volumeDiscountTiers:[{minQty:5,pricePerCredit:1350,label:"5-Pack (10% off)",enabled:true},{minQty:10,pricePerCredit:1200,label:"10-Pack (20% off)",enabled:true},{minQty:25,pricePerCredit:1050,label:"25-Pack (30% off)",enabled:true},{minQty:50,pricePerCredit:900,label:"50-Pack (40% off)",enabled:true}]},youtube_api:{enabled:true,basePrice:1000,label:"YouTube API",recommended:true,description:"Direct broadcast",volumeDiscountTiers:[{minQty:5,pricePerCredit:900,label:"5-Pack (10% off)",enabled:true},{minQty:10,pricePerCredit:800,label:"10-Pack (20% off)",enabled:true},{minQty:25,pricePerCredit:700,label:"25-Pack (30% off)",enabled:true},{minQty:50,pricePerCredit:600,label:"50-Pack (40% off)",enabled:true}]},youtube_embed:{enabled:true,basePrice:500,label:"YouTube Embed",description:"Embed existing",volumeDiscountTiers:[{minQty:5,pricePerCredit:450,label:"5-Pack (10% off)",enabled:true},{minQty:10,pricePerCredit:400,label:"10-Pack (20% off)",enabled:true},{minQty:25,pricePerCredit:350,label:"25-Pack (30% off)",enabled:true}]},third_party:{enabled:true,basePrice:400,label:"Third Party",description:"External embed",volumeDiscountTiers:[{minQty:5,pricePerCredit:360,label:"5-Pack (10% off)",enabled:true},{minQty:10,pricePerCredit:320,label:"10-Pack (20% off)",enabled:true}]} }],
    ["validity_extensions", { defaultDays:30, extensions:[{days:60,creditCost:1,label:"60 Days (+1 credit)",enabled:true},{days:90,creditCost:2,label:"90 Days (+2 credits)",enabled:true},{days:180,creditCost:4,label:"180 Days (+4 credits)",enabled:true},{days:365,creditCost:8,label:"365 Days (+8 credits)",enabled:true}] }],
    ["simulcast_pricing", { youtube:{price:75,enabled:true,label:"YouTube"},facebook:{price:75,enabled:true,label:"Facebook"},custom_rtmp:{price:100,enabled:true,label:"Custom RTMP"} }],
    ["studio_subscription", { enabled:true, annualPrice:1800000, label:"Studio Annual Subscription", description:"White-label platform access and hosting" }],
    ["gst_config", { enabled:true, percentage:18, gstin:"", companyName:"StreamLivee", companyAddress:"" }],
    ["payment_gateways", { razorpay:{enabled:false,label:"Razorpay"}, instamojo:{enabled:false,label:"Instamojo"} }],
  ]
  for (const [key, value] of settings) {
    const val = JSON.stringify(value).replace(/'/g, "''")
    await tryExec(`SEED setting:${key}`, `INSERT INTO platform_settings (key,value) VALUES ('${key}','${val}'::jsonb) ON CONFLICT (key) DO UPDATE SET value='${val}'::jsonb, updated_at=NOW()`)
  }

  // Seed event templates
  const templates = [
    ["Basic Live Stream","general",1],["Wedding Live Stream","wedding",2],
    ["Religious Event","religious",3],["Corporate Webinar","corporate",4],
    ["Concert & Music","entertainment",5],["Product Launch","business",6],
    ["Sports Event","sports",7],["YouTube Embed","youtube",8],["Third Party Embed","third_party",9],
  ]
  for (const [name, cat, ord] of templates) {
    await tryExec(`SEED template:${name}`, `INSERT INTO event_templates (name,category,is_active,sort_order) VALUES ('${name}','${cat}',true,${ord}) ON CONFLICT DO NOTHING`)
  }

  // Summary
  const tableRows = await sql(`SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema='public'`, [])
  const adminRows = await sql(`SELECT COUNT(*) AS c FROM users WHERE role='admin'`, [])

  const ok = results.filter(r => r.status === "ok").length
  const skip = results.filter(r => r.status === "skip").length
  const fail = results.filter(r => r.status === "fail").length

  return NextResponse.json({
    success: fail === 0,
    summary: { ok, skip, fail, totalTables: tableRows[0]?.c, adminUsers: adminRows[0]?.c },
    results,
    adminLogin: { email: "admin@streamlivee.com", password: "admin123" },
  })
}
