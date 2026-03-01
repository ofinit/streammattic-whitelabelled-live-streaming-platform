const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("No DATABASE_URL"); process.exit(1); }
const API_URL = `https://${new URL(DATABASE_URL.replace("postgres://","https://").replace("postgresql://","https://")).hostname}/sql`;

async function exec(query) {
  const r = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Neon-Connection-String": DATABASE_URL },
    body: JSON.stringify({ query, params: [] }),
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`HTTP ${r.status}: ${t.substring(0,300)}`); }
  return r.json();
}

async function run() {
  const stmts = [
    // Extension
    `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

    // ENUMs
    `CREATE TYPE user_role AS ENUM ('admin','studio','streamer')`,
    `CREATE TYPE user_status AS ENUM ('active','suspended','pending','deactivated')`,
    `CREATE TYPE event_status AS ENUM ('draft','scheduled','live','ended','cancelled')`,
    `CREATE TYPE stream_type_key AS ENUM ('rtmp','youtube_api','youtube_embed','third_party')`,
    `CREATE TYPE order_type AS ENUM ('credit_purchase','wallet_recharge','validity_extension','service_charge','studio_upgrade','annual_subscription')`,
    `CREATE TYPE order_status AS ENUM ('pending','completed','failed','refunded','cancelled')`,
    `CREATE TYPE payment_gateway AS ENUM ('razorpay','instamojo','wallet','manual')`,
    `CREATE TYPE payment_status AS ENUM ('pending','processing','completed','failed','refunded')`,
    `CREATE TYPE txn_category AS ENUM ('top_up','credit_purchase','service_charge','order_refund','adjustment','manual_adjustment','payment_recovery','compensation','correction','goodwill','ai_image_generation','whitelabel_hosting','domain_registration','studio_upgrade','annual_subscription')`,
    `CREATE TYPE refund_status AS ENUM ('pending','approved','rejected','processing','completed','failed')`,
    `CREATE TYPE refund_type AS ENUM ('event_cancellation','payment_failure','overcharge','service_issue','manual')`,
    `CREATE TYPE domain_verification_status AS ENUM ('pending','verified','failed')`,
    `CREATE TYPE domain_ssl_status AS ENUM ('pending','provisioning','active','failed')`,
    `CREATE TYPE notification_type AS ENUM ('system','payment','event','wallet','credit','refund','approval','warning','promotional')`,
    `CREATE TYPE invoice_status AS ENUM ('draft','issued','paid','overdue','cancelled','void')`,
    `CREATE TYPE adjustment_type AS ENUM ('credit','debit')`,
    `CREATE TYPE adjustment_category AS ENUM ('goodwill','compensation','correction','manual_top_up','manual_debit','promotional','penalty')`,
    `CREATE TYPE wallet_adjustment_status AS ENUM ('pending','approved','rejected','completed')`,
    `CREATE TYPE youtube_token_status AS ENUM ('valid','expired','revoked')`,

    // Users
    `CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role user_role NOT NULL DEFAULT 'streamer',
      status user_status NOT NULL DEFAULT 'active',
      avatar TEXT,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,

    // Sessions
    `CREATE TABLE sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      ip_address TEXT,
      user_agent TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX idx_sessions_token ON sessions(token)`,
    `CREATE INDEX idx_sessions_user ON sessions(user_id)`,
    `CREATE INDEX idx_sessions_expires ON sessions(expires_at)`,

    // Wallets
    `CREATE TABLE wallets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      balance BIGINT NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,

    // Wallet transactions
    `CREATE TABLE wallet_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('credit','debit')),
      category txn_category NOT NULL,
      amount BIGINT NOT NULL,
      balance_before BIGINT NOT NULL,
      balance_after BIGINT NOT NULL,
      description TEXT,
      reference_id TEXT,
      reference_type TEXT,
      base_amount BIGINT,
      gst_amount BIGINT DEFAULT 0,
      gst_percentage NUMERIC(5,2) DEFAULT 0,
      total_amount BIGINT,
      invoice_number TEXT,
      performed_by UUID REFERENCES users(id),
      reason TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX idx_wtxn_wallet ON wallet_transactions(wallet_id)`,
    `CREATE INDEX idx_wtxn_user ON wallet_transactions(user_id)`,
    `CREATE INDEX idx_wtxn_category ON wallet_transactions(category)`,
    `CREATE INDEX idx_wtxn_created ON wallet_transactions(created_at DESC)`,
    `CREATE INDEX idx_wtxn_ref ON wallet_transactions(reference_id,reference_type)`,

    // User credits
    `CREATE TABLE user_credits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      rtmp INT NOT NULL DEFAULT 0,
      youtube_api INT NOT NULL DEFAULT 0,
      youtube_embed INT NOT NULL DEFAULT 0,
      third_party INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,

    // Credit purchases
    `CREATE TABLE credit_purchases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stream_type stream_type_key NOT NULL,
      quantity INT NOT NULL,
      price_per_credit BIGINT NOT NULL,
      total_price BIGINT NOT NULL,
      discount_tier_label TEXT,
      wallet_transaction_id UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX idx_cpurch_user ON credit_purchases(user_id)`,

    // Credit deductions
    `CREATE TABLE credit_deductions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stream_type stream_type_key NOT NULL,
      amount INT NOT NULL DEFAULT 1,
      reason TEXT NOT NULL,
      event_id UUID,
      validity_days INT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX idx_cdeduct_user ON credit_deductions(user_id)`,

    // Platform settings
    `CREATE TABLE platform_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key TEXT NOT NULL UNIQUE,
      value JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  ];

  let ok = 0, skip = 0;
  for (let i = 0; i < stmts.length; i++) {
    try {
      await exec(stmts[i]);
      ok++;
    } catch (e) {
      if (e.message.includes("already exists")) { skip++; }
      else { console.error(`FAIL [${i}]:`, e.message.substring(0,200)); process.exit(1); }
    }
  }
  console.log(`Batch 1 done: ${ok} executed, ${skip} skipped (already exist)`);
}

run().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
