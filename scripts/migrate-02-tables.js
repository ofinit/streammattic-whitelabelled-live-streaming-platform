const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
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

const statements = [
  // Events table
  `CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    stream_type stream_type_key NOT NULL,
    status event_status NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    thumbnail TEXT,
    stream_key TEXT,
    rtmp_url TEXT,
    playback_url TEXT,
    embed_code TEXT,
    recording_url TEXT,
    viewer_count INT DEFAULT 0,
    max_viewers INT DEFAULT 0,
    validity_days INT NOT NULL DEFAULT 30,
    validity_expires_at TIMESTAMPTZ,
    credit_deduction_id UUID REFERENCES credit_deductions(id),
    simulcast_destinations JSONB DEFAULT '[]',
    simulcast_charges JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)`,
  `CREATE INDEX IF NOT EXISTS idx_events_stream_type ON events(stream_type)`,
  `CREATE INDEX IF NOT EXISTS idx_events_scheduled_at ON events(scheduled_at)`,

  // Orders table
  `CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL UNIQUE,
    type order_type NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    base_amount BIGINT NOT NULL,
    gst_amount BIGINT NOT NULL DEFAULT 0,
    gst_percentage NUMERIC(5,2) DEFAULT 0,
    total_amount BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    description TEXT,
    items JSONB DEFAULT '[]',
    payment_id UUID,
    wallet_transaction_id UUID REFERENCES wallet_transactions(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(type)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`,

  // Payments table
  `CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gateway payment_gateway NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    amount BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    gateway_signature TEXT,
    gateway_response JSONB DEFAULT '{}',
    error_message TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_gateway ON payments(gateway)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_gateway_order_id ON payments(gateway_order_id)`,

  // Payment gateway configs
  `CREATE TABLE IF NOT EXISTS payment_gateway_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway payment_gateway NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT false,
    config JSONB NOT NULL DEFAULT '{}',
    test_mode BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // Notifications
  `CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`,

  // Studio branding
  `CREATE TABLE IF NOT EXISTS studio_branding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    studio_name TEXT,
    logo TEXT,
    favicon TEXT,
    primary_color TEXT DEFAULT '#10b981',
    secondary_color TEXT DEFAULT '#059669',
    custom_css TEXT,
    custom_domain TEXT,
    meta_title TEXT,
    meta_description TEXT,
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // Domains
  `CREATE TABLE IF NOT EXISTS domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL UNIQUE,
    verification_status domain_verification_status NOT NULL DEFAULT 'pending',
    ssl_status domain_ssl_status NOT NULL DEFAULT 'pending',
    verification_token TEXT,
    dns_records JSONB DEFAULT '[]',
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain)`,

  // Refund requests
  `CREATE TABLE IF NOT EXISTS refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    payment_id UUID REFERENCES payments(id),
    type refund_type NOT NULL,
    status refund_status NOT NULL DEFAULT 'pending',
    amount BIGINT NOT NULL,
    reason TEXT NOT NULL,
    admin_notes TEXT,
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMPTZ,
    gateway_refund_id TEXT,
    refund_to TEXT NOT NULL DEFAULT 'wallet',
    wallet_transaction_id UUID REFERENCES wallet_transactions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refund_requests(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_refunds_status ON refund_requests(status)`,

  // Wallet adjustments
  `CREATE TABLE IF NOT EXISTS wallet_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    type adjustment_type NOT NULL,
    category adjustment_category NOT NULL,
    amount BIGINT NOT NULL,
    status wallet_adjustment_status NOT NULL DEFAULT 'pending',
    reason TEXT NOT NULL,
    admin_notes TEXT,
    wallet_transaction_id UUID REFERENCES wallet_transactions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // GST configurations
  `CREATE TABLE IF NOT EXISTS gst_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    gst_percentage NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    hsn_code TEXT,
    applies_to TEXT[] DEFAULT ARRAY['credit_purchase', 'wallet_recharge', 'studio_upgrade'],
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // Invoices
  `CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    invoice_number TEXT NOT NULL UNIQUE,
    status invoice_status NOT NULL DEFAULT 'draft',
    base_amount BIGINT NOT NULL,
    gst_amount BIGINT NOT NULL DEFAULT 0,
    total_amount BIGINT NOT NULL,
    billing_name TEXT,
    billing_address TEXT,
    billing_gstin TEXT,
    items JSONB DEFAULT '[]',
    issued_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id)`,

  // YouTube channels
  `CREATE TABLE IF NOT EXISTS youtube_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL,
    channel_title TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_status youtube_token_status NOT NULL DEFAULT 'valid',
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_youtube_user_id ON youtube_channels(user_id)`,

  // Event templates
  `CREATE TABLE IF NOT EXISTS event_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stream_type stream_type_key NOT NULL,
    title_template TEXT,
    description_template TEXT,
    default_thumbnail TEXT,
    simulcast_destinations JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_event_templates_user ON event_templates(user_id)`,

  // Add FK from orders.payment_id to payments
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_payment') THEN
      ALTER TABLE orders ADD CONSTRAINT fk_orders_payment FOREIGN KEY (payment_id) REFERENCES payments(id);
    END IF;
  END $$`,
];

async function run() {
  let ok = 0, skip = 0, fail = 0;
  for (let i = 0; i < statements.length; i++) {
    try {
      await exec(statements[i]);
      ok++;
    } catch (err) {
      if (err.message.includes("already exists")) {
        skip++;
      } else {
        fail++;
        console.error(`Statement ${i + 1} FAILED:`, err.message.slice(0, 200));
      }
    }
  }
  console.log(`Batch 2 done: ${ok} executed, ${skip} skipped (already exist), ${fail} failed`);
}

run().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
